
const { MongoClient } = require('mongodb');
const uri = "mongodb://localhost:27017/blockranges";
const mongo_client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


function BlockRangeNode(data, db_collection) {
    let _data = data

    var db_collection = db_collection

    return {
        data: () => _data,
        async _find_completed_parent_node() {
            if (!_data.parent_id) { return result }
            await db_collection.deleteOne({ _id: _data._id })

            // fetch all child nodes with parent id that matches this parent_id
            const matching_parent_result = await db_collection.find({ parent_id: _data.parent_id })
            if (await matching_parent_result.count() == 0) {
                const parentRaw = await db_collection.findOne({ _id: _data.parent_id })
                const parent = BlockRangeNode(parentRaw, db_collection)
                if (parent) {
                    return await parent._find_completed_parent_node()
                }
            }
            return this
        },

        subdivide(numberOfChildren, maxChunkSize) {
            var nodes_to_persist = []
            const chunkSize = Math.ceil((_data._id.end - _data._id.start) / numberOfChildren)
            var start = _data._id.start
            while (start < _data._id.end) {
                const child_end = Math.min(start + chunkSize, _data._id.end)
                var node = BlockRangeNode(
                    {
                        _id: {
                            start: start,
                            end: child_end,
                            scan_key: _data._id.scan_key
                        },
                        tree_depth: _data.tree_depth + 1,
                        parent_id: _data._id
                    })
                if (child_end - start > maxChunkSize) {
                    nodes_to_persist.push(...node.subdivide(numberOfChildren, maxChunkSize))
                } else {
                    node.set_is_leaf_node()
                }
                nodes_to_persist.push(node)
                start += chunkSize
            }

            return nodes_to_persist
        },

        set_is_leaf_node() {
            _data.is_leaf_node = true
        },

        async set_current_block_progress(new_value) {
            if (!_data.is_leaf_node) {
                throw new Error("This range has already completed scanning the blockchain.")
            }
            _data.current_block_progress = new_value

            if (_data.current_block_progress == _data._id.end - 1) {
                await this._find_completed_parent_node()
                // log("completed_parent: ", JSON.stringify(completed_parent, null, 2))

            } else {
                await db_collection.updateOne(
                    { _id: _data._id },
                    {
                        $set: {
                            current_block_progress: _data.current_block_progress,
                            time_stamp: new Date()
                        }
                    }
                )
            }
        }
    }
}

async function ScanCoordinator() {
    var db_collection

    await connectDb()

    return {
        async init_scan(start, end, scan_key, number_of_children, min_chunk_size) {
            var nodes_to_persist = []
            const root_node = BlockRangeNode({ _id: { start, end, scan_key }, tree_depth: 0 }, db_collection)
            nodes_to_persist.push(root_node)

            nodes_to_persist.push(...root_node.subdivide(number_of_children, min_chunk_size))
            nodes_to_persist = nodes_to_persist.map(n => n.data())
            await db_collection.insertMany(nodes_to_persist)
        },

        async get_number_leaf_nodes(scan_key) {
            const result = await db_collection.countDocuments(
                {
                    "_id.scan_key": scan_key,
                    "is_leaf_node": true,
                })

            return result
        },

        async deleteAll(scan_key) {
            await db_collection.deleteMany({ "_id.scan_key": scan_key })
        },

        async find_range_for_block_num(block_num, scan_key) {
            const result = await db_collection.find(
                {
                    "_id.start": { $lt: block_num }, "_id.end": { $gt: block_num }, "_id.scan_key": scan_key
                }, { sort: { tree_depth: -1 } })
            const raw = await result.next()
            if (!raw) {
                throw new Error(`No pending blockrange to scan for this blocknum: ${block_num}, scan_key: ${scan_key}`)
            }
            return BlockRangeNode(raw, db_collection)
        },

        async start_next_range(scan_key) {
            const result = await db_collection.findOneAndUpdate(
                {
                    is_leaf_node: true
                },
                { $set: { time_stamp: new Date() } },
                {
                    sort: { time_stamp: 1 },
                    returnDocument: "after"
                }
            )

            const raw = await result.value
            if (!raw) {
                throw new Error(`No pending blockrange to scan forscan_key: ${scan_key}`)
            }
            return BlockRangeNode(raw, db_collection)
        },

        async update_current_block_progress(block_num, scan_key) {
            let range = await this.find_range_for_block_num(block_num, scan_key)
            await range.set_current_block_progress(block_num)
        }
    }

    async function connectDb() {
        db_collection = await _connectDb();
        //     this.db_collection.createIndex({
        //         "name": 1
        //     }, { unique: true, background: true });

    }

    async function _connectDb() {
        return new Promise((resolve, reject) => {
            mongo_client.connect(err => {
                const collection = mongo_client.db("eosdacapi").collection("blockranges");
                if (err) {
                    reject(err)
                } else {
                    resolve(collection)
                }
            });
        })
    }
}

module.exports = { ScanCoordinator };
