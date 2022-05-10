const { serializeMessage } = require("./state-history.utils");

class GetBlocksRequest {
    _version = 'v0';
    _types;
    _startBlock;
    _endBlock;
    _shouldFetchTraces;
    _shouldFetchDeltas;

    constructor(startBlock, endBlock, { shouldFetchTraces, shouldFetchDeltas }, types) {
        this._types = types;    
        this._startBlock = startBlock;    
        this._endBlock = endBlock;    
        this._shouldFetchTraces = shouldFetchTraces;    
        this._shouldFetchDeltas = shouldFetchDeltas;    
    }

    toUint8Array() {
        return serializeMessage('request', [`get_blocks_request_${this._version}`, { 
            irreversible_only: false,
            start_block_num: this._startBlock,
            end_block_num: this._endBlock,
            max_messages_in_flight: 1,
            have_positions: [],
            fetch_block: true,
            fetch_traces: this._shouldFetchTraces,
            fetch_deltas: this._shouldFetchDeltas, 
        }], this._types);
    }
}

class GetBlocksAckRequest {
    _version = 'v0';
    _types;
    _messagesCount;

    constructor(messagesCount, types) {
        this._types = types;    
        this._messagesCount = messagesCount;      
    }

    toUint8Array() {
        return serializeMessage(
            'request',
            [
                `get_blocks_ack_request_${this._version}`,
                { num_messages: this._messagesCount },
            ],
            this._types);
    }
}

module.exports = {
    GetBlocksRequest,
    GetBlocksAckRequest,
};