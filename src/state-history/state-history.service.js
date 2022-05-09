const { Block } = require("./block");
const { serializeMessage, deserializeMessage } = require("./state-history.utils");
const { StateHistoryAbi } = require("./state-history.abi");
const { WaxNodeSource, connectionState } = require("./wax-node.source");

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
        this._source = new WaxNodeSource(
            config,
            (message) => this._onMessage(message),
            (error) => this._onError(error)
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
        this._connected = true;
        this._abi = StateHistoryAbi.create(abi);
    }

    _onDisconnected() {
        this._abi = null;
        this._connected = false;
    }

    async _onMessage(message) {
        const { types } = this._abi;
        const [type, response] = deserializeMessage('result', message, types);

        switch (type) {
            case 'get_status_result_v0': {
                log(response);
                return;
            }
            case 'get_blocks_result_v0': {
                await this._handleBlocksResultMessage(response); 
                return;
            }
            default: {
                await this._onErrorHandler(
                    new Error(`Unhandled message type: ${type}`)
                );
            }
        }
    }

    async _ackGetBlocksRequests(count = 1) {
        try {
            const { types } = this._abi;
            this._source.send(
                serializeMessage(
                    'request',
                    ['get_blocks_ack_request_v0', { num_messages: count }],
                    types
                ),
            );
        } catch (error) {
            await this._onErrorHandler(error);
        }
    }

    async _handleBlocksResultMessage(message) {
        if (this._blockRangeRequest) {
            const block = Block.create(message, this._abi, this._blockRangeRequest);
            await this._receivedBlockHandler(block);

            // If received block is the last one call onComplete handler
            if (block.isLast) {
                this._blockRangeRequest = null;
                await this._blockRangeCompleteHandler(blockRange);
            }

            // State history plugs will answer every call of ack_request, even after
            // processing the full range, it will send messages containing only head.
            // After the block has been processed, the connection should be closed so
            // there is no need to ack request.
            if (this._connected) {
                // Acknowledge a request so that source can send next one.
                this._ackGetBlocksRequests();
            }
        } else {
            await this._onErrorHandler(new Error(
                'Something went wrong we got a message while no block range is being processed'
            ));
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
            await this._onErrorHandler(new Error(
                'Set handlers before calling connect()'
            ));
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
        if (this._blockRangeRequest) {
             await this._onErrorHandler(new Error(
                `Error sending the block_range request, the current request was not completed or canceled`
            ));
        }

        if (!this._connected) {
            await this._onErrorHandler(
                new Error(`Client is not connected, requestBlocks cannot be called`)
            );
        }

        this._blockRangeRequest = new BlockRangeRequest(blocksRange, shouldFetchTraces, shouldFetchDeltas);

        try {
            const { types } = this._abi;
            const message = serializeMessage('request', ['get_blocks_request_v0', { 
                irreversible_only: false,
                start_block_num: blocksRange.start,
                end_block_num: blocksRange.end,
                max_messages_in_flight: 1,
                have_positions: [],
                fetch_block: true,
                fetch_traces: shouldFetchTraces,
                fetch_deltas: shouldFetchDeltas, 
            }], types);
            this._source.send(message);
        } catch (error) {
            this._onErrorHandler(error);
        }
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