const { Block } = require("./block");
const { StateHistoryAbi } = require("./state-history.abi");
const { WaxNodeSource, connectionState } = require("./wax-node.source");
const {
    MissingHandlersError,
    UnhandledMessageError,
    UnhandledMessageTypeError,
    UnhandledBlocksRequestError
} = require("./state-history.errors");
const { GetBlocksAckRequest, GetBlocksRequest } = require("./state-history.requests");
const { StateHistoryMessage } = require("./state-history.message");
const { BlocksRange } = require("../common/blocks-range");

const log = (...args) => console.log(`process:${process.pid} | `, ...args);

class BlockRangeRequest {
    _blockRange;
    _shouldFetchTraces;
    _shouldFetchDeltas;

    constructor(blockRange, { shouldFetchTraces, shouldFetchDeltas }) {
        this._blockRange = blockRange;
        this._shouldFetchDeltas = shouldFetchDeltas;
        this._shouldFetchTraces = shouldFetchTraces;
    }

    get blockRange() {
        return this._blockRange;
    }
    
    get shouldFetchTraces() {
        return this._shouldFetchTraces;
    }
    
    get shouldFetchDeltas() {
        return this._shouldFetchDeltas;
    }
}

class StateHistoryService {
    _abi;
    _blockRangeRequest;
    _source;
    _connected = false;
    _receivedBlockHandler;
    _blockRangeCompleteHandler;
    _disconnectHandler;
    _errorHandler = log;
    _warningHandler = log;

    constructor(config) {
        this._source = new WaxNodeSource(
            config,
            (message) => this._onMessage(message),
            (error) => this._handleError(error)
        );
        this._source.addConnectionStateHandler(
            connectionState.Connected,
            (abi) => this._onConnected(abi)
        );
        this._source.addConnectionStateHandler(
            connectionState.Disconnected,
            () => this._onDisconnected()
        );
    }

    _onConnected(abi) {
        this._abi = StateHistoryAbi.create(abi);
    }

    _onDisconnected() {
        this._abi = null;
    }

    async _onMessage(dto) {
        const message = StateHistoryMessage.create(dto, this._abi);

        if (message.isGetStatusResult) {
            log(response);
        } else if (message.isGetBlocksResult) {
            await this._handleBlocksResultMessage(message.content); 
        } else {
            await this._handleError(new UnhandledMessageTypeError(message.type));
        }
    }

    async _handleBlocksResultMessage(message) {
        try {
            if (message.this_block) {
                const block = Block.create(message, this._abi, this._blockRangeRequest);
                await this._receivedBlockHandler(block);

                // If received block is the last one call onComplete handler
                if (block.isLast) {
                    const { startBlock, endBlock, blockNumber, queueKey } = block;
                    this._blockRangeRequest = null;
                    await this._blockRangeCompleteHandler(
                        new BlocksRange(startBlock, endBlock, queueKey, blockNumber)
                    );
                }
            } else {
                await this._handleWarning(`the received message does not contain this_block`);
            }
            // State history plugs will answer every call of ack_request, even after
            // processing the full range, it will send messages containing only head.
            // After the block has been processed, the connection should be closed so
            // there is no need to ack request.
            if (this._source.isConnected) {
                const { types } = this._abi;
                // Acknowledge a request so that source can send next one.
                this._source.send(new GetBlocksAckRequest(1, types).toUint8Array());
            }
        } catch (error) {
            log(error);
            return this._handleError(new UnhandledMessageError(message, error));
        }
    }

    async _handleError(error) {
        if (this._errorHandler) {
            return this._errorHandler(error);
        }
    }
    
    async _handleWarning(...args) {
        if (this._warningHandler) {
            return this._warningHandler(...args);
        }
    }

    // PUBLIC

    async connect() {
        if (
            !this._receivedBlockHandler ||
            !this._blockRangeCompleteHandler
        ) {
            return this._handleError(new MissingHandlersError());
        }

        if (!this._source.isConnected) {
            await this._source.connect();
        }
    }

    async disconnect() {
        if (this._source.isConnected) {
            return this._source.disconnect();
        }
    }

    async requestBlocks(blocksRange, options) {
        // still processing block range request?
        if (this._blockRangeRequest) {
             return this._handleError(new UnhandledBlocksRequestError(blocksRange));
        }
        
        try {
            const { types } = this._abi;
            const { start, end } = blocksRange;

            this._blockRangeRequest = new BlockRangeRequest(blocksRange, options);
            this._source.send(
                new GetBlocksRequest(start, end, options, types).toUint8Array()
            );
        } catch (error) {
            return this._handleError(error);
        }
    }

    async onReceivedBlock(handler) {
        this._receivedBlockHandler = handler;
    }

    async onBlockRangeComplete(handler) {
        this._blockRangeCompleteHandler = handler;
    }

    _onConnected(abi) {
        this._abi = StateHistoryAbi.create(abi);
    }

    async onError(handler) {
        this._errorHandler = handler;
    }
    
    async onWarning(handler) {
        this._warningHandler = handler;
    }
}

module.exports = { StateHistoryService };