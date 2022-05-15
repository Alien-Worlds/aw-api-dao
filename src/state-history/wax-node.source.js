const WebSocket = require('ws');
const { log } = require('./state-history.utils');

const connectionState = {
    Connecting: 'connecting',
    Connected: 'connected',
    Idle: 'idle',
    Disconnecting: 'disconnecting',
}

class WaxNodeSource {
    _config;
    _client;
    _errorHandler;
    _incomingMessageHandler;
    _connectionState = connectionState.Idle;
    _connectionChangeHandlers = new Map();
    _socketIndex = -1;

    constructor(
        config,
        incomingMessageHandler,
        errorHandler,
    ) {
        this._config = config;
        this._incomingMessageHandler = incomingMessageHandler;
        this._errorHandler = errorHandler;
    }

    async _updateConnectionState(state, data) {
        this._connectionState = state;

        const handler = this._connectionChangeHandlers.get(state);

        if (handler) {
            return handler(data);
        }
    }

    _getNextEndpoint(){
        let nextIndex = ++this._socketIndex;

        if (nextIndex >= this._config.wsEndpoints.length){
            nextIndex = 0;
        }
        this._socketIndex = nextIndex;

        return this._config.wsEndpoints[this._socketIndex];
    }

    // PUBLIC

    addConnectionStateHandler(state, handler) {
        if (this._connectionChangeHandlers.has(state)) {
            // log warning
        } else {
            this._connectionChangeHandlers.set(state, handler);
        }
    }

    get isConnected() {
        return this._connectionState === connectionState.Connected;
    }

    async connect() {
        if (this._connectionState === connectionState.Idle) {
            try {
                await this._updateConnectionState(connectionState.Connecting);
                this._client = new WebSocket(this._getNextEndpoint(), { perMessageDeflate: false });
                this._client.on('error', error => this._errorHandler(error));
                
                await new Promise(resolve => this._client.once('open', resolve));
                // receive ABI
                const abi = await new Promise(resolve => this._client.once('message', resolve));
                // set message handler
                this._client.on('message', message => this._incomingMessageHandler(message));
                
                await this._updateConnectionState(connectionState.Connected, abi);
            } catch (error) {
                this._errorHandler(error);
            }
        }
    }

    async disconnect() {
        if (this._connectionState === connectionState.Connected) {
            try {
                await this._updateConnectionState(connectionState.Disconnecting);
                this._client.removeAllListeners();
                this._client.close();

                await new Promise(resolve => this._client.once('close', resolve));
                await this._updateConnectionState(connectionState.Idle);
            } catch (error) {
                this._errorHandler(error);
            }
        }
    }

    dispose() {
        this._errorHandler = null;
        this._incomingMessageHandler = null;
        this._connectionChangeHandlers.clear();
    }

    send(message) {
        this._client.send(message);
    }
}

module.exports = { WaxNodeSource, connectionState };