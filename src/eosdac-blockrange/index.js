#!/usr/bin/env node

process.title = 'eosdac-blockrange';

const cluster = require('cluster');
const commander = require('commander');
const { log } = require("../state-history/state-history.utils");
const { MainThread } = require("../common/main-thread");
const { WorkerMessageType } = require("../common/worker-message");
const { loadConfig } = require('../functions');
const { BlockRangeWorker } = require('./blockrange-worker.thread');
const { BlockRangeErrorType } = require('./blockrange-worker.errors');

const start = async () => {
    const config = loadConfig();
    const { clusterSize } = config.blockRange;

    if (cluster.isMaster) {
        log(`Running block_range main process.`);

        const mainThread = new MainThread(clusterSize);

        // If next block range was not found 
        mainThread.addMessageHandler(
            WorkerMessageType.NoNextBlockRangeFound,
            async (message) => {
                const { pid } = message;
                mainThread.removeWorker(pid);
                log('No block ranges were found');
                if (mainThread.workersCount === 0) {
                    log('No block ranges were found and all workers are closed, time to close the block_range main process');
                    process.exit(0);
                }
            }
        );
        // In case of an error, remove the worker and create a new one in its place
        mainThread.addMessageHandler(
            WorkerMessageType.Error,
            async (message) => {
                const { pid, error } = message;
                log(error);
                mainThread.removeWorker(pid);

                if (error.name !== BlockRangeErrorType.ReadTimeout) {
                    mainThread.addWorker();
                }

                if (mainThread.workersCount === 0) {
                    log('No block ranges were found and all workers are closed, time to close the block_range main process');
                    process.exit(0);
                }
            }
        );
        // In case of a warning, log it
        mainThread.addMessageHandler(
            WorkerMessageType.Warning,
            async (message) => log(message.error)
        );

        mainThread.initWorkers();
    } else {     
        log(`Running block_range worker`);

        const worker = new BlockRangeWorker(config);
        await worker.start();
    }
}

commander
    .version('0.1', '-v, --version')
    .parse(process.argv);

start(commander);