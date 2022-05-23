const MongoClient = require('mongodb').MongoClient;
const { loadConfig } = require('../functions');
const { log } = require('../state-history/state-history.utils');
const { BlockRange } = require('./block-range');

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

class BlockRangeRepository { 
    _client;
    _config;
    _queueItemsCollection;
    _collection;

    async _findRangeForBlockNumber(blockNumber) {
        const { scanKey } = this._config;
        const result = await this._collection.find(
            {
                "_id.start": { $lte: blockNumber },
                "_id.end": { $gt: blockNumber },
                "_id.scan_key": scanKey,
            },
            { sort: { tree_depth: -1 } }
        );
        const document = await result.next();
        return document;
    }

    async _findCompletedParentNode(document) {
        const { _id, parent_id } = document;

        if (parent_id) {
            await this._collection.deleteOne({ _id })
            // fetch all child nodes with parent id that matches this parent_id
            const matchingParentResult = await this._collection.find({ parent_id });
            if (await matchingParentResult.count() == 0) {
                const parentDocument = await this._collection.findOne({ _id: parent_id });
                await this._findCompletedParentNode(parentDocument);
            }
        }
    }

    async _setCurrentBlockProgress(document, processedBlockNumber) {
        const { _id, is_leaf_node  } = document;
        const { start, end  } = _id;
        if (!is_leaf_node) {
            throw new Error(
                `(${start}-${end}) range has already completed scanning the blockchain.`,
            );
        }

        if (processedBlockNumber == end - 1) {
            await this._findCompletedParentNode(document);
        } else {
            await this._collection.updateOne(
                { _id },
                {
                    $set: {
                        current_block_progress: processedBlockNumber,
                        time_stamp: new Date()
                    }
                }
            );
        }
    }

    // Public

    async init() {
        this._config = loadConfig();
        this._client = await connectMongo(this._config);
        const db = this._client.db(this._config.mongo.dbName);
        //
        this._collection = db.collection('blocks_range_queue');
    }

    async startNextRange() {
        const result = await this._collection.findOneAndUpdate(
            {
                is_leaf_node: true,
                time_stamp : { $exists : false },
            },
            { $set: { time_stamp: new Date() } },
            {
                sort: { time_stamp: 1 },
                returnDocument: "after"
            }
        );
        const document = await result.value;
        return document ? BlockRange.fromDocument(document) : null;
    }

    async createBlockRange(startBlock, endBlock) {
        const {
            scanKey,
            blockRange: { numberOfChildren, minChunkSize }
        } = this._config;
        const rootRange = BlockRange.create(startBlock, endBlock, scanKey, 0);
        const rangesToPersist = [rootRange];

        rangesToPersist.push(
            ...BlockRange.createChildRanges(rootRange, numberOfChildren, minChunkSize)
        );

        const documents = rangesToPersist.map(range => range.toDocument());
        await this._collection.insertMany(documents);
    }

    async getNumberLeafNodes(scanKey) {
        const result = await this._collection.countDocuments({
            "_id.scan_key": scanKey,
            "is_leaf_node": true,
        });

        return result;
    }
    
    async countBlockRanges(scanKey, startBlock, endBlock) {
        const options = [
            { '_id.scan_key': scanKey },
        ];

        if (startBlock) {
            options.push({ '_id.start': { $gte: startBlock } })
        }

        if (endBlock) {
            options.push({ '_id.end': { $lte: endBlock } })
        }

        const result = await this._collection.countDocuments({
            $and: options,
        });

        return result;
    }

    async removeAll(scanKey) {
        await this._collection.deleteMany({ "_id.scan_key": scanKey })
    }

    async findBlockRange(startBlock, endBlock) {
        const { scanKey } = this._config;
        const dto = await this._collection.findOne({
            $and: [
               { '_id.start': startBlock },
               { '_id.end': endBlock },
               { '_id.scan_key': scanKey },
            ]
        });
        
        return dto ? BlockRange.fromDocument(dto) : null;
    }
    
    async hasUnprocessedBlockRanges(scanKey, startBlock, endBlock) {
        const options = [
            { '_id.scan_key': scanKey },
            { tree_depth: { $gt: 0 } },
        ];

        if (startBlock) {
            options.push({ '_id.start': { $gte: startBlock } })
        }

        if (endBlock) {
            options.push({ '_id.end': { $lte: endBlock } })
        }

        const dto = await this._collection.findOne({ $and: options });
        
        return !!dto;
    }

    async updateProcessedBlockNumber(blockNumber) {
        const range = await this._findRangeForBlockNumber(blockNumber);
        return this._setCurrentBlockProgress(range, blockNumber);
    }
}

module.exports = { BlockRangeRepository };
