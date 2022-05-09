class MainThread {
    _workersCount;
    _workersByPid = new Map();
    _handlersByMessageType = new Map();
    _workerMessageHandler;

    constructor(workersCount){
        this._workersCount = workersCount;
        this._workerMessageHandler = handler;
    }

    get workersCount() {
        return this._workersCount;
    }

    initWorkers() {
        for (let i = 0; i < this._workersCount; i++) {
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
        if (this._workersByPid.size < this._workersCount) {
            this._createWorker();
        } else {
            // no more workers
        }
    }

    removeWorker(pid) {
        const worker = this._workersByPid.get(workerMessage.pid);

        if (worker) {
            worker.kill();
            this._workersByPid.delete(pid);
        } else {
            //worker not defined
        }
    }

    async _onWorkerMessage(workerMessage) {
        const worker = this._workersByPid.get(workerMessage.pid);
        const handler = this._handlersByMessageType.get(workerMessage.type);

        if(worker) {
            if (handler) {
                await handler(workerMessage);
            }
        } else {
            //worker not defined
        }
    }

    _createWorker() {
        const worker = cluster.fork();
        worker.on('message', async (workerMessage) => this._onWorkerMessage(workerMessage));
        this._workersByPid.set(worker.process.pid, worker);
    }
}

module.exports = { MainThread };