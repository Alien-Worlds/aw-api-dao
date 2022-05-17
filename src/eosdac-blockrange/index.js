#!/usr/bin/env node

process.title = 'eosdac-blockrange';

const cluster = require('cluster');
const commander = require('commander');
const { log } = require("../state-history/state-history.utils");
const { QueueName } = require("../connections/amq.source");
const { MainThread } = require("../common/main-thread");
const { BlockRangeWorker } = require('./blockrange-worker.thread');
const { WorkerMessageType } = require("../common/worker-message");
const { BlocksRangeQueueRepository } = require('../common/block-range-queue.repository');
const { MessageService } = require('../connections/message.service');
const { loadConfig } = require('../functions');
const { BlocksRange } = require('../common/blocks-range');

const start = async (options) => {
    const config = loadConfig();

    if (cluster.isMaster) {
        const { version } = options;

        log(`Running block_range main process.`);
        const messageService = new MessageService(config.amq.connectionString);
        await messageService.init();

        const queueRepository = new BlocksRangeQueueRepository();
        await queueRepository.init();

        const mainThread = new MainThread(config.fillClusterSize);
        // When the main thread receives the message that block processing is complete,
        // we need to update processed block number of the current range in the database.
        mainThread.addMessageHandler(
            WorkerMessageType.ProcessedBlock,
            async (message) => {
                const { content: 
                    { start, end, processedBlockNumber, queueKey }
                } = message;
                const blocksRange = new BlocksRange(start, end, queueKey, processedBlockNumber);
                await queueRepository.updateProcessedBlockNumber(blocksRange);
            }
        );
        // When the main thread receives a message that the processing of the entire
        // blocks range is complete. We need to remove this range from the database
        // so that it will not be reprocessed in the event of restarting the filler.
        // It should also send a message to the filler to check that the entire
        // process has finished and that there are no unprocessed ranges.
        mainThread.addMessageHandler(
            WorkerMessageType.Complete,
            async (message) => {
                log(`Main BlockRange thread received COMPLETE MESSGAE FROM WORKER ${message.pid} IS DONE!`);
                const { content: 
                    { start, end, processedBlockNumber, queueKey }
                } = message;
                const blocksRange = new BlocksRange(start, end, queueKey, processedBlockNumber)
                await messageService.send(QueueName.BlockRangeQueue, BlocksRange.toBuffer(blocksRange));
            }
        );
        // In case of an error, remove the worker and create a new one in its place
        mainThread.addMessageHandler(
            WorkerMessageType.Error,
            async (workerMessage) => {
                const { pid, error } = workerMessage;
                log(error);
                mainThread.removeWorker(pid);
                mainThread.addWorker();
            }
        );
        // In case of a warning, log it
        mainThread.addMessageHandler(
            WorkerMessageType.Warning,
            async (workerMessage) => {
                const { error } = workerMessage;
                log(error);
            }
        );

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