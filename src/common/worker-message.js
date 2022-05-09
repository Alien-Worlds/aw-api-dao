class WorkerMessage {
    _pid;
    _type;
    _content;
    _error;

    constructor({pid, type, content, error}){
        this._pid = pid;
        this._type = type;
        this._content = content;
        this._error = error;
    }

    get pid() {
        return this._pid;
    }
    
    get type() {
        return this._type;
    }
    
    get content() {
        return this._content;
    }
    
    get error() {
        return this._error;
    }
}

const WorkerMessageType = {
    Error: 'error',
    Warning: 'warning',
    Complete: 'complete',
}

module.exports = { WorkerMessage, WorkerMessageType };