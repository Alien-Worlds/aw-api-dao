const { deserializeMessage } = require("./state-history.utils");

class Block {

    _blockNumber;
    _range;
    _block;
    _traces;
    _deltas;
    _isLast;
    _abi

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

        const isLast = block_num === blockRange.end - 1;
    
        return new Block(abi, block_num, blockRange, deserializedBlock, deserializedTraces, deserializedDeltas, isLast)
    }

    constructor(abi, blockNumber, range, block, traces, deltas, isLast) {
        this._abi = abi;
        this._blockNumber = blockNumber;
        this._range = range;
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
    
    get range() {
        return this._range;
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