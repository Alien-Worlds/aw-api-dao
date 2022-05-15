const { deserializeMessage, getBlockTimestamp } = require("./state-history.utils");

class Block {
    _blockTimestamp;
    _blockNumber;
    _startBlock;
    _endBlock;
    _block;
    _traces;
    _deltas;
    _isLast;
    _abi

    static create(blockMessage, abi, blockRangeRequest) {
        const {
            shouldFetchTraces,
            shouldFetchDeltas,
            blockRange: { start, end }
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

        const timestamp = getBlockTimestamp(deserializedBlock);
        const isLast = block_num === end - 1;

        return new Block(
            abi,
            block_num,
            timestamp,
            start,
            end,
            deserializedBlock,
            deserializedTraces,
            deserializedDeltas,
            isLast
        );
    }

    constructor(
        abi,
        blockNumber,
        timestamp,
        startBlock,
        endBlock,
        block,
        traces,
        deltas,
        isLast
    ) {
        this._abi = abi;
        this._blockNumber = blockNumber;
        this._blockTimestamp = timestamp;
        this._startBlock = startBlock;
        this._endBlock = endBlock;
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
    
    get blockTimestamp() {
        return this._blockTimestamp;
    }
    
    get startBlock() {
        return this._startBlock;
    }
    
    get endBlock() {
        return this._endBlock;
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