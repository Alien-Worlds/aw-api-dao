class BlockNumberOutOfRangeError extends Error {
    start;
    end;
    scanKey;

    constructor(blockNumber, scanKey){
        super(`Block number ${blockNumber} is out of range or is assigned to a different key than "${scanKey}"`);
    }
}

module.exports = { BlockNumberOutOfRangeError };
