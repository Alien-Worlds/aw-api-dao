class WorkerMessage {
    pid;
    type;
    content;
    error;

    constructor({ pid, type, content, error }){
        this.pid = pid;
        this.type = type;
        this.content = content;
        if (error) {
            const { message, stack, name, ...rest } = error;
            this.error = {
                message,
                stack,
                name,
                ...rest,
            };
        }
    }
}

const WorkerMessageType = {
    Error: 'error',
    Warning: 'warning',
    Complete: 'complete',
    NextBlockRange: 'next_block_range',
    NoNextBlockRangeFound: 'no_next_block_range_found',
}

module.exports = { WorkerMessage, WorkerMessageType };