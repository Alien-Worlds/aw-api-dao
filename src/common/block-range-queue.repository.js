const MongoClient = require('mongodb').MongoClient;
const { loadConfig } = require('../functions');
const { BlocksRange } = require('./blocks-range');
const { BlocksRangeQueue } = require('./blocks-range-queue');

async function connectMongo(config) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(config.mongo.url, {useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
            if (err) {
                console.error("\nFailed to connect\n", err);
                reject(err)
            } else if (client) {
                console.log(`Connected to mongo at ${config.mongo.url}`);
                resolve(client)
            }
        });
    });
}

class BlocksRangeQueueRepository { 
    _client;
    _queueItemsCollection;
    _queueCollection;

    // Public

    async init() {
        const config = loadConfig();
        this._client = await connectMongo(config);
        const db = this._client.db(config.mongo.dbName);
        //
        this._queueItemsCollection = db.collection('blocks_range_queue_items');
        this._queueItemsCollection.createIndex({
            "key" : 1,
            "start" : 1,
            "end" : 1,
        }, {unique:true, background:true});
        this._queueCollection = db.collection('blocks_range_queue');
        this._queueCollection.createIndex({
            "key" : 1,
            "start_block" : 1,
            "end_block" : 1,
        }, {unique:true, background:true});
    }

    async createBlockRangeQueue(startBlock, endBlock, lastIrreversibleBlock) {
        const queue = BlocksRangeQueue.create(
            startBlock,
            endBlock,
            lastIrreversibleBlock,
        );
        const session = this._client.startSession();

        try {
            await session.withTransaction(async () => {
                await this._queueCollection.insertOne(queue.toDocument());
                const documents = queue.items.map(blocksRange => blocksRange.toDocument());
                await this._queueItemsCollection.insertMany(documents);
            }, {
                readPreference: 'primary',
                readConcern: { level: 'local' },
                writeConcern: { w: 'majority' }
            });
        } finally {
            await session.endSession();
        }

        return queue;
    }

    async removeBlocksRange(blocksRange) {
        const { key, start, end } = blocksRange;
        console.log('Remove blocks Range', key)
        const session = this._client.startSession();

        try {
            await session.withTransaction(async () => {
                await this._queueCollection.updateOne(
                    { $and: [
                        { start_block: { $lte: start } },
                        { end_block: { $gte: end } },
                     ] },
                    { $inc: { queue_size: -1 } }
                );
                await this._queueItemsCollection.deleteOne({ key });
            }, {
                readPreference: 'primary',
                readConcern: { level: 'local' },
                writeConcern: { w: 'majority' }
            });
        } finally {
            await session.endSession();
        }
    }

    async removeBlocksRangeQueue(queue) {
        const { key } = queue;
        console.log('Remove queue', key)
        return this._queueCollection.deleteOne({ key });
    }

    async findBlocksRangeQueue(startBlock, endBlock) {
        const dto = this._queueCollection.find({
            $and: [
               { start_block: startBlock },
               { end_block: endBlock },
            ]
         });

        return dto ? BlocksRangeQueue.fromDocument(dto) : null;
    }

    async updateProcessedBlockNumber(blocksRange) {
        const { processedBlockNumber, key } = blocksRange;
        return this._queueItemsCollection.updateOne(
            { key },
            { $set: { processed_block_number: processedBlockNumber } },
        );
    }
    
    async getQueueSize(queue) {
        const { key } = queue;
        const dto = await this._queueCollection.findOne({ key });

        return dto ? dto.queue_size : NaN;
    }
}

module.exports = { BlocksRangeQueueRepository };
