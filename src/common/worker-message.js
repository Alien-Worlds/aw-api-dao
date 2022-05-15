class WorkerMessage {
    pid;
    type;
    content;
    error;

    constructor({pid, type, content, error}){
        this.pid = pid;
        this.type = type;
        this.content = content;
        this.error = error;
    }
}

const WorkerMessageType = {
    Error: 'error',
    Warning: 'warning',
    Complete: 'complete',
    ProcessedBlock: 'processed_block',
}

module.exports = { WorkerMessage, WorkerMessageType };