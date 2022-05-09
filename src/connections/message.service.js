const { AmqSource } = require('./amq.source');

class MessageService {
    _source;

    constructor(url) {
        this._source = new AmqSource(url, console);
    }

    async init() {
        await this._source.init();
    }

    onConnected(handler) {
        this._source.onConnected(handler);
    }
    onDisconnected(handler) {
        this._source.onDisconnected(handler);
    }
    
    addListener(queue, handler) {
        this._source.addListener(queue, handler);
    }

    send(queue, message) {
        this._source.send(queue, message);
    }

    ack(message) {
        this._source.ack(message);
    }

    reject(message) {
        this._source.reject(message);
    }
}

module.exports = { MessageService };
