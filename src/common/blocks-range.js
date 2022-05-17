const MongoLong = require('mongodb').Long;
const { Int64BE } = require("int64-buffer");

class BlocksRange {
    _start;
    _end;
    _processedBlockNumber;
    _queueKey;

    static createKey(start, end) {
        return `${start}-${end}`;
    }

    static toBuffer(blockRange) {
        return Buffer.concat([
            new Int64BE(blockRange.start).toBuffer(),
            new Int64BE(blockRange.end).toBuffer(),
            new Int64BE(blockRange.processedBlockNumber).toBuffer(),
            Buffer.from(blockRange.queueKey),
        ])
    }

    static create(message) {
        const startBuffer = message.content.slice(0, 8);
        const endBuffer = message.content.slice(8, 16);
        const processedBlockNumberBuffer = message.content.slice(16, 24);
        const queueKeyBuffer = message.content.slice(24);
        const startBlock = new Int64BE(startBuffer).toString();
        const endBlock = new Int64BE(endBuffer).toString();
        const processedBlockNumber = 
            new Int64BE(processedBlockNumberBuffer).toString();

        return new BlocksRange(
            startBlock,
            endBlock,
            queueKeyBuffer.toString(),
            processedBlockNumber,
        );
    }

    static fromDocument(document) {
        const { start, end, processed_block_number, queue_key } = document;
        
        return new BlocksRange(start, end, queue_key, processed_block_number);
    }

    constructor(start, end, queueKey, processedBlockNumber){
        this._start = start;
        this._end = end;
        this._queueKey = queueKey;
        this._processedBlockNumber = processedBlockNumber;
    }

    get start() {
        return parseInt(this._start);
    }
    
    get end() {
        return parseInt(this._end);
    }
    get processedBlockNumber() {
        return parseInt(this._processedBlockNumber);
    }
    
    get key() {
        return BlocksRange.createKey(this._start, this._end);
    }

    get queueKey() {
        return this._queueKey;
    }

    toDocument() {
        const doc = {
            start: MongoLong.fromString(this._start.toString()),
            end: MongoLong.fromString(this._end.toString()),
            key: this.key,
            queue_key: this._queueKey,
        }

        if (this._processedBlockNumber) {
            doc.processed_block_number = parseInt(this._processedBlockNumber);
        }

        return doc;
    }

    toBuffer() {
        return Buffer.concat([
            new Int64BE(this._start).toBuffer(),
            new Int64BE(this._end).toBuffer(),
            new Int64BE(this._processedBlockNumber).toBuffer(),
            Buffer.from(this._queueKey, "utf-8"),
        ])
    }
    
    toJson() {
        return {
            start: this._start,
            end: this._end,
            processedBlockNumber: this._processedBlockNumber,
            queueKey: this._queueKey,
        };
    }
}

module.exports = { BlocksRange };
