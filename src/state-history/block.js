const { deserializeMessage } = require("./state-history.utils");

class Block {
    static create(blockMessage, abi, blockRangeRequest) {
        const {
            shouldFetchTraces,
            shouldFetchDeltas,
            blockRange
        } = blockRangeRequest;
        const { types } = abi;
        const {
            this_block: { block_num },
            block,
            traces,
            deltas
        } = blockMessage;

        let deserializedBlock;
        let deserializedTraces = [];
        let deserializedDeltas = [];

        if (block && block.length > 0) {
            deserializedBlock = deserializeMessage('signed_block', block, types);
        }
            
        if (shouldFetchTraces && traces && traces.length > 0){
            deserializedTraces = deserializeMessage('transaction_trace[]', traces, types);
        }

        if (shouldFetchDeltas && deltas && deltas.length > 0){
            deserializedDeltas = deserializeMessage('table_delta[]', deltas, types);
        }

        const isLast = block_num === blockRange.endBlock - 1;

        return new Block(abi, block_num, deserializedBlock, deserializedTraces, deserializedDeltas, isLast)
    }

    _blockNumber;
    _block;
    _traces;
    _deltas;
    _isLast;
    _abi

    constructor(abi, blockNumber, block, traces, deltas, isLast) {
        this._abi = abi;
        this._blockNumber = blockNumber;
        this._traces = traces;
        this._deltas = deltas;
        this._block = block;
        this._isLast = isLast;
    }

    get abi() {
        return this._abi;
    }

    get blockNumber() {
        return this._blockNumber;
    }

    get block() {
        return this._block;
    }

    get traces() {
        return this._traces;
    }

    get deltas() {
        return this._deltas;
    }

    get isLast() {
        return this._isLast;
    }
}

module.exports = { Block };