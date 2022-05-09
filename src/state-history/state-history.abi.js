const { Serialize } = require('eosjs');

class StateHistoryAbi {
    _abi;
    _types;

    static create(dto) {
        const abi = JSON.parse(dto);
        const types = Serialize.getTypesFromAbi(Serialize.createInitialTypes(), abi);

        return new StateHistoryAbi(abi, types);
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