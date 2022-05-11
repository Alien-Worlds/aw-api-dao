const fetch = require('node-fetch');

const { Api, JsonRpc } = require('@jafri/eosjs2');
const { TextDecoder, TextEncoder } = require('text-encoding');
const { loadConfig } = require('../../functions');
const { MessageService } = require('../../connections/message.service');
const { log } = require("../../state-history/state-history.utils");
const { BlocksRangeQueueRepository } = require('../../common/block-range-queue.repository');
const { BlocksRange } = require('../../common/blocks-range');
const { QueueName } = require('../../connections/amq.source');

const createBlocksRangeQueue = (options) => {
    const { startBlock = 0 } = options;
    const rpc = new JsonRpc(config.eos.endpoint, {fetch});
    const api = new Api({
        rpc,
        signatureProvider: null,
        chainId: config.chainId,
        textDecoder: new TextDecoder(),
        textEncoder: new TextEncoder(),
    });
    const blocksRanges = [];
    const info = await api.rpc.get_info();
    const lastIrreversibleBlock = info.last_irreversible_block_num;
    const endBlock = options.endBlock 
        ? parseInt(options.endBlock)
        : lastIrreversibleBlock;
    const range = endBlock - startBlock;
    const defaultChunkSize = 5000;
    const chunkSizeByClusterSize = parseInt(range/ config.fillClusterSize);
    const chunkSize = Math.min(chunkSizeByClusterSize, defaultChunkSize);
    
    let from = parseInt(startBlock);
    let to = from + chunkSize;
    let i = 0;
    let chunksCount = parseInt(range/ chunkSize);

    // because we operate on integers, we must make sure that we send
    // the appropriate number of messages to fill the entire range
    // look for the remainder
    if (chunkSize * parseInt(endBlock / chunkSize) !== endBlock) {
        chunksCount += 1;
    }
    
    while (i < chunksCount) {
        if (to > endBlock) {
          to = endBlock;
          i = chunksCount;
        }
    
        blocksRanges.push(new BlocksRange(from, to));
    
        from += chunkSize;
        to += chunkSize;
        i++;
    }

    return blocksRanges;
}

const runFillerReplayMode = async (options) => {
    const config = loadConfig();

    log(`Replaying from ${startBlock} in parallel mode`);
    
    const blocksRangeQueue = await createBlocksRangeQueue(options);
    const messageService = new MessageService(config.amq.connectionString);
    await messageService.init();

    blocksRangeQueue.forEach(blockRange => {
        messageService.send(QueueName.BlockRange, blockRange.toBuffer());
    });

    // const queueRepository = new BlocksRangeQueueRepository();
    // await queueRepository.init();
    // await queueRepository.addMultipleBlocksRange(blocksRanges);
    
    log(`Queued ${blocksRangeQueue.length} jobs`);
}

module.exports = { runFillerReplayMode };
