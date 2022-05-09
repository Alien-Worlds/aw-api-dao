const { Serialize } = require('eosjs');

class StateHistoryAbi {
    _abi;
    _types;

    static fromDto(dto) {
        this._abi = JSON.parse(dto);
        this._types = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), abi);
    }

    constructor(abi, types) {
        this._abi = abi;
        this._types = types;
    }

    get abi() {
        return this._abi;
    }

    get types() {
        return this._types;
    }
}

module.exports = { StateHistoryAbi };