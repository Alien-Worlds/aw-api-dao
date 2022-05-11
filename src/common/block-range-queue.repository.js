const { BlocksRange } = require('./blocks-range');

class BlocksRangeQueueRepository {    
    _collection;

    async init() {
        const config = loadConfig();
        const mongo = await connectMongo(config);
        //
        this._collection = mongo.collection('blocks_range_queue');
        this._collection.createIndex({
            "key" : 1,
            "start" : 1,
            "end" : 1,
        }, {unique:true, background:true});
    }

    async addBlocksRange(blocksRange) {
        return this._collection.insertOne(blocksRange.toDocument());
    }

    async addMultipleBlocksRange(blocksRanges) {
        const documents = blocksRanges.map(range => range.toDocument());

        return this._collection.insertMany(documents);
    }

    async removeBlocksRange(blocksRange) {
        const { key } = blocksRange;
        return this._collection.deleteOne({ key });
    }

    async updateProcessedBlockNumber(blocksRange) {
        const { processedBlockNumber, key } = blocksRange;
        return this._collection.updateOne(
            { key },
            {
                $set: { processedBlockNumber }
            },
        );
    }
}

module.exports = { BlocksRangeQueueRepository };
