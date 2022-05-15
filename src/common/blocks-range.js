const MongoLong = require('mongodb').Long;
const { Int64BE } = require("int64-buffer");

class BlocksRange {
    _start;
    _end;
    _processedBlockNumber;

    static toBuffer(blockRange) {
        return Buffer.concat([
            new Int64BE(blockRange.start).toBuffer(),
            new Int64BE(blockRange.end).toBuffer(),
            new Int64BE(blockRange.processedBlockNumber).toBuffer(),
        ])
    }

    static create(message) {
        const startBuffer = message.content.slice(0, 8);
        const endBuffer = message.content.slice(8, 16);
        const processedBlockNumberBuffer = message.content.slice(16);
        const startBlock = new Int64BE(startBuffer).toString();
        const endBlock = new Int64BE(endBuffer).toString();
        const processedBlockNumber = new Int64BE(processedBlockNumberBuffer).toString();
        
        return new BlocksRange(startBlock, endBlock, processedBlockNumber);
    }

    static fromDocument(document) {
        const { start, end, processed_block_number } = document;
        
        return new BlocksRange(start, end, processed_block_number);
    }

    constructor(start, end, processedBlockNumber){
        this._start = start;
        this._end = end;
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
        return `${this._start}-${this._end}`;
    }

    toDocument() {
        const doc = {
            start: MongoLong.fromString(this._start.toString()),
            end: MongoLong.fromString(this._end.toString()),
            key: this.key
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
        ])
    }
    
    toJson() {
        return {
            start: this._start,
            end: this._end,
            processedBlockNumber: this._processedBlockNumber,
        };
    }
}

module.exports = { BlocksRange };