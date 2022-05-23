const MongoLong = require('mongodb').Long;

class BlockRangeParent {
    start;
    end;
    scanKey;

    constructor(start, end, scanKey){
        this.start = parseInt(start);
        this.end = parseInt(end);
        this.scanKey = scanKey;
    }

    static create(start, end, scanKey) {
        return new BlockRangeParent(start, end, scanKey);
    }

    static fromDocument(document) {
        const { start, end, scan_key } = document;
        
        return new BlockRangeParent(
            start,
            end,
            scan_key,
        );
    }

    toDocument() {
        const doc = {
            start: MongoLong.fromString(this.start.toString()),
            end: MongoLong.fromString(this.end.toString()),
            scan_key: this.scanKey,
        }

        return doc;
    }
}

class BlockRange {
    start;
    end;
    currentBlockProgress;
    scanKey;
    timestamp;
    isLeafNode;
    treeDepth;
    parent;

    static create(start, end, scanKey, treeDepth, parent) {
        return new BlockRange(start, end, scanKey, treeDepth || 0, parent);
    }

    static createChildRanges(blockRange, numberOfChildren, maxChunkSize) {
        const { start: parentStart, end: parentEnd, scanKey, treeDepth } = blockRange;
        const chunkSize = Math.ceil((parentEnd - parentStart) / numberOfChildren)
        let rangesToPersist = []
        let start = parentStart;

        while (start < parentEnd) {
            const end = Math.min(start + chunkSize, parentEnd)
            let range = BlockRange.create(
                start,
                end,
                scanKey,
                treeDepth + 1,
                BlockRangeParent.create(parentStart, parentEnd, scanKey)
            );

            if (end - start > maxChunkSize) {
                const childRanges = BlockRange.createChildRanges(range, numberOfChildren, maxChunkSize);
                childRanges.forEach(range => rangesToPersist.push(range));
            } else {
                range.setAsLeafNode();
            }

            rangesToPersist.push(range)
            start += chunkSize
        }

        return rangesToPersist;
    }

    static fromDocument(document) {
        const {
            _id: { start, end, scan_key },
            current_block_progress,
            time_stamp,
            tree_depth,
            parent_id,
            is_leaf_node,
        } = document;

        const parent = parent_id ? BlockRangeParent.fromDocument(parent_id) : null;

        return new BlockRange(
            start,
            end,
            scan_key,
            tree_depth,
            parent,
            is_leaf_node,
            current_block_progress,
            time_stamp
        );
    }

    constructor(
        start,
        end,
        scanKey,
        treeDepth,
        parent,
        isLeafNode,
        currentBlockProgress,
        timestamp
    ){
        this.start = parseInt(start);
        this.end = parseInt(end);
        this.scanKey = scanKey;
        this.treeDepth = treeDepth || 0;

        if (parent) {
            this.parent = parent;
        }
        if (currentBlockProgress) {
            this.currentBlockProgress = parseInt(currentBlockProgress);
        }
        this.timestamp = timestamp;
        this.isLeafNode = isLeafNode;
    }

    setAsLeafNode() {
        this.isLeafNode = true;
    }

    toDocument() {
        const doc = {
            _id: {
                start: MongoLong.fromString(this.start.toString()),
                end: MongoLong.fromString(this.end.toString()),
                scan_key: this.scanKey,
            },
            tree_depth: this.treeDepth
        }

        if (this.currentBlockProgress) {
            doc.current_block_progress =
                MongoLong.fromString(this.currentBlockProgress.toString());
        }

        if (typeof this.isLeafNode == "boolean") {
            doc.is_leaf_node = this.isLeafNode;
        }

        if (this.parent) {
            doc.parent_id = this.parent.toDocument();
        }

        if (this.timestamp) {
            doc.time_stamp = this.timestamp;
        }

        return doc;
    }
}

module.exports = { BlockRange, BlockRangeParent };
