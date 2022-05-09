const cluster = require('cluster');
const { loadConfig } = require('../../functions');
const { MainThread } = require('../common/main-thread');
const { FillerWorker } = require('./filler-worker.thread');

const runFillerProcessOnlyMode = () => {

    const config = loadConfig();
    const logger = require('../../connections/logger')('eosdac-filler', config.logger);

    if (cluster.isMaster) {
        logger.info(`Starting block_range listener only`);

        const mainThread = new MainThread(config.fillClusterSize);

        mainThread.addMessageHandler('complete', (workerMessage) => {
            const { pid } = workerMessage;
            mainThread.removeWorker(pid);    
            // if (we need more workers to finish processing the range or leftovers) {
            //  mainThread.addWorker();
            // }
        });

        mainThread.addMessageHandler('error', (workerMessage) => {
            const { pid, error } = workerMessage;
            // log error
            mainThread.removeWorker(pid);
            mainThread.addWorker();
        });

        mainThread.initWorkers();
    } else {
        logger.info(`Listening to queue for block_range ONLY`);

        const filler = new FillerWorker(config);
        await filler.start();
    }
}

module.exports = { runFillerProcessOnlyMode };
