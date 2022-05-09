const { Block } = require("./block");
const { StateHistoryAbi } = require("./state-history.abi");
const { WaxNodeSource } = require("./wax-node.source");

const log = (...args) => console.log(`process:${process.pid} | `, ...args);

class BlockRangeRequest {
    _blockRange;
    _shouldFetchTraces;
    _shouldFetchDeltas
    
    inProgress = true;

    constructor(blockRange, shouldFetchTraces, shouldFetchDeltas) {
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
    _onErrorHandler = log;

    constructor(config) {
        this._source = new WaxNodeSource(config, this._onMessage, this._onError);
        this._source.addConnectionStateHandler(
            connectionState.Connected,
            this._onConnected
        );
        this._source.addConnectionStateHandler(
            connectionState.Disconnected,
            this._onDisconnected
        );
    }

    _onConnected(abi) {
        this._connected = true;
        this._abi = StateHistoryAbi.fromDto(abi);
    }

    _onDisconnected() {
        this._abi = null;
        this._connected = false;
    }

    async _onMessage(type, message) {
        switch (type) {
            case 'get_status_result_v0': {
                log(message);
                return;
            }
            case 'get_blocks_result_v0': {
                await this._handleBlocksResultMessage(message); 
                return;
            }
            default: {
                throw new Error(`Unhandled message type: ${type}`);
            }
        }
    }

    async _handleBlocksResultMessage(message) {
        if (this._blockRangeRequest.inProgress) {
            const block = Block.create(message, this._abi, this._blockRangeRequest);

            await this._receivedBlockHandler(block);

            // If received block is the last one call onComplete handler
            if (block.isLast) {
                this._blockRangeRequest.inProgress = false;
                await this._blockRangeCompleteHandler(blockRange);
            }

            // State history plugs will answer every call of ack_request, even after
            // processing the full range, it will send messages containing only head.
            // After the block has been processed, the connection should be closed so
            // there is no need to ack request.
            if (this._connected) {
                // Acknowledge a request so that source can send next one.
                this._source.ackGetBlocksRequests();
            }
        } else {
            throw new Error(
                'Something went wrong we got a message while no block range is being processed'
            );
        }
    }

    async _onError(error) {
        await this._onErrorHandler(error);
    }

    // PUBLIC

    async connect() {
        if (
            !this._receivedBlockHandler ||
            !this._blockRangeCompleteHandler
        ) {
            throw new Error(
                'Set onReceivedBlock and onBlockRangeComplete handlers before calling connect()'
            );
        }

        if (!this._connected) {
            await this._source.connect();
        }
    }

    async disconnect() {
        await this._source.disconnect();
        this._connected = false;
    }

    async requestBlocks(blocksRange, shouldFetchTraces, shouldFetchDeltas) {
        // still processing block range request?
        if (this._blockRangeRequest.inProgress) {
            throw new Error(`Error sending the block_range request, the current request was not completed or canceled`);
        }

        if (this._connected) {
            const { startBlock, endBlock } = blocksRange;
            this._blockRangeRequest = new BlockRangeRequest(blocksRange, shouldFetchTraces, shouldFetchDeltas);
            this._source.requestBlocks(
                startBlock,
                endBlock,
                shouldFetchTraces,
                shouldFetchDeltas,
            );
        }

        throw new Error(`Client is not connected, requestBlocks cannot be called`);
    }

    async onReceivedBlock(handler) {
        this._receivedBlockHandler = handler;
    }

    async onBlockRangeComplete(handler) {
        this._blockRangeCompleteHandler = handler;
    }
    async onError(handler) {
        this._onErrorHandler = handler;
    }
}

module.exports = { StateHistoryService };