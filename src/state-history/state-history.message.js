const { deserializeMessage } = require("./state-history.utils");

class StateHistoryMessage {
    _version = 'v0';
    _type;
    _content;

    static create(dto, abi) {
        const [type, content] = deserializeMessage('result', dto, abi.types);
        return new StateHistoryMessage(type, content);
    }

    constructor(type, content) {
        this._type = type;
        this._content = content;
    }

    get content() {
        return this._content;
    }

    get type() {
        return this._type;
    }

    get isGetStatusResult() {
        return this._type === `get_status_result_${this._version}`;
    }

    get isGetBlocksResult() {
        return this._type === `get_blocks_result_${this._version}`;
    }
}

module.exports = {
    StateHistoryMessage,
};