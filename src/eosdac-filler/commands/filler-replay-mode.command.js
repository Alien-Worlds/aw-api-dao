const fetch = require('node-fetch');

const { Api, JsonRpc } = require('@jafri/eosjs2');
const { TextDecoder, TextEncoder } = require('text-encoding');
const { loadConfig } = require('../../functions');
const { MessageService } = require('../../connections/message.service');
const { log } = require("../../state-history/state-history.utils");
const { BlocksRangeQueueRepository } = require('../../common/block-range-queue.repository');
const { BlocksRange } = require('../../common/blocks-range');
const { QueueName } = require('../../connections/amq.source');
const { defaultEndBlock } = require('../filler.defaults');

const getLastIrreversibleBlock = async (config) => {
    const rpc = new JsonRpc(config.eos.endpoint, {fetch});
    const api = new Api({
        rpc,
        signatureProvider: null,
        chainId: config.chainId,
        textDecoder: new TextDecoder(),
        textEncoder: new TextEncoder(),
    });
    const info = await api.rpc.get_info();
    return info.last_irreversible_block_num;
}

const onBlockRangeCompleteMessage = async (message, messageService, queueRepository) => {
    const blocksRange = BlocksRange.create(message);

    log(`Main Filler thread received COMPLETE message ${blocksRange.key} IS DONE!`);

    await queueRepository.removeBlocksRange(blocksRange);

    const queueSize = await queueRepository.getQueueSize(blocksRangeQueue);

    if (queueSize === 0) {
        await queueRepository.removeBlocksRangeQueue(blocksRangeQueue);
    }

    messageService.ack(message);
}

const runFillerReplayMode = async (options) => {
    const config = loadConfig();
    const startBlock = options.startBlock || 0;
    const lastIrreversibleBlock = await getLastIrreversibleBlock(config);
    const endBlock = options.endBlock != defaultEndBlock 
        ? parseInt(options.endBlock)
        : lastIrreversibleBlock;

    log(`Replaying from ${startBlock} in parallel mode`);
    // What if the main thread has been interrupted and we have some
    // unfinished queues? We check that the given starting and ending
    // blocks are not in these queues
    
    const queueRepository = new BlocksRangeQueueRepository();
    await queueRepository.init();

    const messageService = new MessageService(config.amq.connectionString);
    await messageService.init();

    // After receiving the message about the completed block range,
    // we can verify the overall status of the queue
    messageService.addListener(
        QueueName.BlockRangeQueue,
        async (message) =>
            onBlockRangeCompleteMessage(message, messageService, queueRepository),
    );

    const unhandledMessages = await messageService.getQueueStats(QueueName.BlockRange).messageCount;
    
    if (unhandledMessages === 0) {
        // Prepare a list of block ranges in the database to control the flow
        // of the entire process.
        const blocksRangeQueue = await queueRepository.createBlockRangeQueue(
            startBlock,
            endBlock,
            lastIrreversibleBlock,
        );

        // Prepare tasks for the block range process
        blocksRangeQueue.items.forEach(blockRange => {
            messageService.send(QueueName.BlockRange, blockRange.toBuffer());
        });

        log(`Queued ${blocksRangeQueue.items.length} jobs`);
    }

    // The queue contains the messages so most likely this process has been reset. 
    // In this case, we do not create new messages, but continue our work from the place
    // where we left off.
}

module.exports = { runFillerReplayMode };
