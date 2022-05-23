const fetch = require('node-fetch');

const { Api, JsonRpc } = require('@jafri/eosjs2');
const { TextDecoder, TextEncoder } = require('text-encoding');
const { loadConfig } = require('../../functions');
const { log } = require("../../state-history/state-history.utils");
const { BlockRangeRepository } = require('../../common/block-range.repository');
const { defaultEndBlock } = require('../filler.defaults');

const getLastIrreversibleBlock = async (config) => {
    try {
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
    } catch (error) {
        log(error);
        return -1;
    }
}

const runFillerReplayMode = async (options) => {
    const config = loadConfig();
    const { scanKey } = config;
    const startBlock = options.startBlock || 0;
    const lastIrreversibleBlock = await getLastIrreversibleBlock(config);
    const endBlock = options.endBlock != defaultEndBlock 
        ? parseInt(options.endBlock)
        : lastIrreversibleBlock;

    log(`Replaying from ${startBlock} to ${endBlock} in parallel mode`);
    
    const rangeRepository = new BlockRangeRepository();
    await rangeRepository.init();

    // Look for an incomplete scan that matches the scanKey given in config.
    // If found, block_range processes will continue this scan.

    if (await rangeRepository.hasUnprocessedBlockRanges(scanKey, startBlock, endBlock)) {
        log(`Incomplete "${scanKey}" block range (${startBlock}-${endBlock}) scan was found.`);
        log(`block_range processes will continue scanning.`);
    } else {
        if (await rangeRepository.hasScanKey(scanKey)) {
            log(`The key "${scanKey}" has already been used. Please use a different scan key`);
        } else {
            await rangeRepository.createBlockRange(scanKey, startBlock, endBlock);
            log(`Created "${scanKey}" block range (${startBlock}-${endBlock})`);
            log(`block_range processes will scan this range.`);
        }
    }
    process.exit(0);
}

module.exports = { runFillerReplayMode };
