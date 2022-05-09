const cluster = require('cluster');
const Int64BE = require('int64-buffer').Int64BE;
const { Api, JsonRpc } = require('@jafri/eosjs2');
const { TextDecoder, TextEncoder } = require('text-encoding');
const { loadConfig } = require('../../functions');
const { MainThread } = require('../common/main-thread');
const { FillerWorker } = require('./filler-worker.thread');
const { MessageService } = require('../../connections/message.service');

const queueBlockRangeMessages = async (startBlock, config, logger) => {

    const rpc = new JsonRpc(config.eos.endpoint, {fetch});
    const api = new Api({
        rpc,
        signatureProvider: null,
        chainId: config.chainId,
        textDecoder: new TextDecoder(),
        textEncoder: new TextEncoder(),
    });

    const info = await api.rpc.get_info();
    const lastIrreversibleBlock = info.last_irreversible_block_num;

    const messageService = new MessageService(config.amq.connectionString);
    await messageService.init();

    // let chunkSize = 5000;
    // const range = lastIrreversibleBlock - startBlock;

    // if (chunkSize > (range / config.fillClusterSize)) {
    //     chunkSize = parseInt((range) / config.fillClusterSize)
    // }

    // let from = parseInt(startBlock);
    // if (isNaN(from) || from === -1) {
    //     from = 0
    // }
    // let to = from + chunkSize; // to is not inclusive

    // let breakNow = false;
    // let messagesCount = 0;

    // while (true) {
    //     logger.info(`adding job for ${from} to ${to}`);
    //     let from_buffer = new Int64BE(from).toBuffer();
    //     let to_buffer = new Int64BE(to).toBuffer();

    //     this.amq.send('block_range', Buffer.concat([from_buffer, to_buffer]));
    //     messagesCount++;

    //     if (to === lastIrreversibleBlock) {
    //         breakNow = true
    //     }

    //     from += chunkSize;
    //     to += chunkSize;

    //     if (to > lastIrreversibleBlock) {
    //         to = lastIrreversibleBlock
    //     }

    //     if (from > to) {
    //         breakNow = true
    //     }

    //     if (breakNow) {
    //         break
    //     }
    // }
    //------

    const chunkSize = 5000;
    let endBlock = lastIrreversibleBlock;
    let from = startBlock;
    let to = from + chunkSize;
    let i = 0;
    let messagesCount = 0;
    let chunksCount = parseInt((endBlock - startBlock) / chunkSize);
    
    // because we operate on integers, we must make sure that we send
    // the appropriate number of messages to fill the entire range
    // look for the remainder
    if (chunkSize * (endBlock / chunkSize) !== endBlock) {
        chunksCount += 1;
    }

    while (i < chunksCount) {
        process.stdout.write(
          `Sending ${messagesCount}/${chunksCount} messages\r`
        );

        if (to > endBlock) {
          to = endBlock;
          i = chunksCount;
        }

        messageService.send(
            'block_range',
            Buffer.concat([
                new Int64BE(from).toBuffer(),
                new Int64BE(to).toBuffer()
            ])
        );

        from += chunkSize;
        to += chunkSize;
        i++;
        messagesCount++;
    }

    logger.info(`Queued ${messagesCount} jobs`);
}

const runFillerReplayMode = async (options) => {

    const config = loadConfig();
    const logger = require('../../connections/logger')('eosdac-filler', config.logger);

    if (cluster.isMaster) {
        logger.info(`Replaying from ${startBlock} in parallel mode`);

        const { startBlock = 0 } = options;
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

        await queueBlockRangeMessages(startBlock, config, logger);
        mainThread.initWorkers();
    } else {     
        logger.info(`Listening to queue for block_range`);

        const filler = new FillerWorker(config);
        await filler.start();
    }
}

module.exports = { runFillerReplayMode };
