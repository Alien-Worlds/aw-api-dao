const { ActionHandler, TraceHandler, DeltaHandler } = require('../../handlers');
const DacDirectory = require('../../dac-directory');
const { MessageService } = require('../../connections/message.service');
const { StateHistoryService } = require('../../state-history/state-history.service');
const { BlockRange } = require('../../common/block-range');
const { loadConfig } = require('../../functions');
const { getBlockTimestamp, log } = require('../../state-history/state-history.utils');

const runFillerTestMode = async (testBlock) => {
    const config = loadConfig();
    const logger = require('../../connections/logger')('eosdac-filler', config.logger);

    logger.info(`Testing single block ${testBlock}`);

    const messageService = new MessageService(config.amq.connectionString);
    await messageService.init();

    const dacDirectory = new DacDirectory({ config });

    const actionHandler = new ActionHandler({
        queue: messageService._source,
        config,
        dac_directory: dacDirectory,
        logger
    });

    const traceHandler = new TraceHandler({
        queue: messageService._source,
        action_handler: actionHandler,
        config,
        logger
    });

    const deltaHandler = new DeltaHandler({
        queue: messageService._source,
        config,
        dac_directory: dacDirectory,
        logger
    });

    let startTimestamp;
    let endTimestamp;

    const stateHistory = new StateHistoryService(config.eos);
    stateHistory.onReceivedBlock(async (block) => {
        startTimestamp = Date.now();
        await dacDirectory.reload();
        await processBlock(
            block,
            { traceHandler, deltaHandler}
        );
        processedBlock = block;
    });
    stateHistory.onBlockRangeComplete(async () => {
        endTimestamp = Date.now();
        log('Test Completed in', endTimestamp - startTimestamp, 'ms');
    });

    await stateHistory.connect();
    await stateHistory.requestBlocks(
        new BlockRange(testBlock, testBlock + 1),
        {
            shouldFetchTraces: true,
            shouldFetchDeltas: true,
        }
    );
}

const processBlock = async (blockData, handlers) => {
    const { deltaHandler, traceHandler } = handlers;
    const { blockNumber, range, block, traces, deltas, abi } = blockData;
    const blockTimestamp = getBlockTimestamp(block);

    log(`StateReceiver : received block ${blockNumber}`);
    log(`Start: ${range.start}, End: ${range.end}, Current: ${blockNumber}`);
    log(`deltas: ${deltas.length}, traces: ${traces.length}`);

    if (deltas.length > 0){
        deltaHandler.processDelta(blockNumber, deltas, abi.types, blockTimestamp);
    }

    if (traces.length > 0){
        traceHandler.processTrace(blockNumber, traces, blockTimestamp);
    }
}

module.exports = { runFillerTestMode };
