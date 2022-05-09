class WorkerThread {
    _handlersByMessageType = new Map();

    constructor() {
        process.on('message', (message) => this._handleMainThreadMessage(message));
    }

    get id() {
        return process.pid;
    }

    addMessageHandler(type, handler) {
        this._handlersByMessageType.set(type, handler);
    }

    sendToMainThread(message) {
        try {
            process.send(message);
        } catch (error) {
            log('Could not send message to main thread due to: ', error)
        }
    }

    async _handleMainThreadMessage(message) {
        const handler = this._handlersByMessageType.get(message.type);

        if (handler) {
            await handler(message);
        }
    }

    async start(){}
    async stop(){}
}

module.exports = { WorkerThread };