const cluster = require('cluster');

class MainThread {
    _maxWorkersCount;
    _workersByPid = new Map();
    _handlersByMessageType = new Map();
    _workerReadyHandler;

    constructor(maxWorkersCount){
        this._maxWorkersCount = maxWorkersCount;
    }

    get workersCount() {
        return this._workersByPid.size;
    }

    initWorkers() {
        for (let i = 0; i < this._maxWorkersCount; i++) {
            this._createWorker();
        }
    }

    addMessageHandler(type, handler) {
        this._handlersByMessageType.set(type, handler);
    }

    sendToWorker(pid, message) {
        const worker = this._workersByPid.get(pid);

        if(worker) {
            worker.send(message);
        } else {
            // worker not defined with given id
        }
    }

    addWorker() {
        if (this._workersByPid.size < this._maxWorkersCount) {
            this._createWorker();
        } else {
            // no more workers
        }
    }

    removeWorker(pid) {
        const worker = this._workersByPid.get(pid);

        if (worker) {
            worker.kill();
            this._workersByPid.delete(pid);
        } else {
            //worker not defined
        }
    }

    onWorkerReady(handler) {
        this._workerReadyHandler = handler;
    }

    async _onWorkerMessage(message) {
        const worker = this._workersByPid.get(message.pid);
        const handler = this._handlersByMessageType.get(message.type);

        if (worker) {
            if (handler) {
                await handler(message);
            }
        } else {
            //worker not defined
        }
    }

    _createWorker() {
        const worker = cluster.fork();
        worker.on('message', async (message) => this._onWorkerMessage(message));
        this._workersByPid.set(worker.process.pid, worker);
        if (this._workerReadyHandler) {
            this._workerReadyHandler(worker.id);
        }
    }
}

module.exports = { MainThread };