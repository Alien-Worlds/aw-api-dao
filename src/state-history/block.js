const { deserializeMessage, getBlockTimestamp } = require("./state-history.utils");

class Block {
    static create(blockMessage, abi, blockRangeRequest) {
        const {
            shouldFetchTraces,
            shouldFetchDeltas,
            blockRange,
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
        const isLast = block_num === blockRange.end - 1;

        blockRange.currentBlockProgress = block_num;

        return new Block(
            abi,
            block_num,
            timestamp,
            blockRange,
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
        range,
        block,
        traces,
        deltas,
        isLast
    ) {
        this.abi = abi;
        this.blockNumber = blockNumber;
        this.blockTimestamp = timestamp;
        this.range = range;
        this.traces = traces;
        this.deltas = deltas;
        this.block = block;
        this.isLast = isLast;
    }
}

module.exports = { Block };