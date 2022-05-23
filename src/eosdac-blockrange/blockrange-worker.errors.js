class BlockRangesReadTimeoutError extends Error {
    constructor() {
        super('The waiting limit for reading the block ranges queue exceeded');
        this.name = BlockRangeErrorType.ReadTimeout
    }
}

const BlockRangeErrorType = {
    ReadTimeout: 'BlockRangesReadTimeoutError',
}

module.exports = { BlockRangesReadTimeoutError, BlockRangeErrorType };
