const { loadConfig } = require('../functions');
const { BlocksRange } = require('./blocks-range');

const MongoLong = require('mongodb').Long;

class BlocksRangeQueue {
    _start;
    _end;
    _lastIrreversibleBlock;
    _queueSize;
    _items;

    static createKey(start, end) {
        return `${start}-${end}`;
    }

    static fromDocument(document) {
        const {
            start_block,
            end_block,
            last_irreversible_block,
            queue_size,
        } = document;

        return new BlocksRangeQueue(
            start_block.toString(),
            end_block.toString(),
            last_irreversible_block.toString(),
            queue_size,
        );
    }
    
    static create(startBlock, endBlock, lastIrreversibleBlock) {
        const config = loadConfig();
        const blocksRanges = [];
        const range = endBlock - startBlock;
        const defaultChunkSize = 5000;
        const chunkSizeByClusterSize =
            parseInt(range/ config.fillClusterSize);
        const chunkSize =
            Math.min(chunkSizeByClusterSize, defaultChunkSize);
        
        let from = parseInt(startBlock);
        let to = from + chunkSize;
        let shouldCreateBlockRange = true;

        while (shouldCreateBlockRange) {
            if (to >= endBlock) {
                to = endBlock;
                shouldCreateBlockRange = false;
            }

            blocksRanges.push(
                new BlocksRange(
                    from,
                    to,
                    BlocksRangeQueue.createKey(startBlock, endBlock)
                )
            );
            from += chunkSize;
            to += chunkSize;
        }

        const queue = new BlocksRangeQueue(
            startBlock,
            endBlock,
            lastIrreversibleBlock,
            blocksRanges.length,
            blocksRanges,
        );

        return queue;
    }

    constructor(start, end, lastIrreversibleBlock, queueSize, items){
        this._start = start;
        this._end = end;
        this._lastIrreversibleBlock = lastIrreversibleBlock;
        this._queueSize = queueSize;
        this._items = items || [];
    }

    get start() {
        return parseInt(this._start);
    }
    
    get end() {
        return parseInt(this._end);
    }

    get lastIrreversibleBlock() {
        return parseInt(this._lastIrreversibleBlock);
    }
    
    get queueSize() {
        return parseInt(this._queueSize);
    }
    
    get items() {
        return this._items;
    }
    
    get key() {
        return BlocksRangeQueue.createKey(this._start, this._end);
    }

    toDocument() {
        const doc = {
            start_block: MongoLong.fromString(this._start.toString()),
            end_block: MongoLong.fromString(this._end.toString()),
            last_irreversible_block: MongoLong.fromString(
                this._lastIrreversibleBlock.toString()
            ),
            queue_size: this._queueSize,
            key: this.key
        }

        return doc;
    }
}

module.exports = { BlocksRangeQueue };
