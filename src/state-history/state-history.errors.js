class ServiceNotConnectedError extends Error {
    constructor() {
        super(`Client is not connected, requestBlocks cannot be called`);
    }
}

class UnhandledMessageTypeError extends Error {
    constructor(type) {
        super(`Unhandled message type: ${type}`);
        this.type = type;
    }
}

class UnhandledMessageError extends Error {
    constructor(message, error) {
        super('Received a message while no block range is being processed');
        this.message = message;
        this.error = error;
    }
}

class MissingHandlersError extends Error {
    constructor() {
        super('Set handlers before calling connect()');
    }
}

class UnhandledBlocksRequestError extends Error {
    constructor(blockRange) {
        super(`Error sending the block_range request ${blockRange.key}. The current request was not completed or canceled.`);
    }
}

module.exports = {
    ServiceNotConnectedError,
    UnhandledMessageTypeError,
    UnhandledMessageError,
    MissingHandlersError,
    UnhandledBlocksRequestError,
};