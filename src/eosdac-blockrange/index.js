#!/usr/bin/env node

process.title = 'eosdac-blockrange';

const commander = require('commander');
const { log } = require("../../state-history/state-history.utils");
const { QueueName } = require("../connections/amq.source");
const { BlockRangeWorker } = require('./blockrange-worker.thread');
const { WorkerMessageType } = require("../common/worker-message");

const start = async (options) => {

    const config = loadConfig();

    if (cluster.isMaster) {
        const { version } = options;

        log(`Running block_range main process. Version:${version}`);

        const mainThread = new MainThread(config.fillClusterSize);

        mainThread.addMessageHandler('complete', (workerMessage) => {
            const { pid } = workerMessage;
            mainThread.removeWorker(pid);    
            // if (we need more workers to finish processing the range or leftovers) {
            //  mainThread.addWorker();
            // }
        });

        mainThread.addMessageHandler(WorkerMessageType.Error, (workerMessage) => {
            const { pid, error } = workerMessage;
            log(error);
            mainThread.removeWorker(pid);
            mainThread.addWorker();
        });
        mainThread.addMessageHandler(WorkerMessageType.Warning, (workerMessage) => {
            const { error } = workerMessage;
            log(error);
        });

        mainThread.initWorkers();
    } else {     
        log(`Listening to queue for ${QueueName.BlockRange}`);

        const worker = new BlockRangeWorker(config);
        await worker.start();
    }
}

commander
    .version('0.1', '-v, --version')
    .parse(process.argv);

start(commander);