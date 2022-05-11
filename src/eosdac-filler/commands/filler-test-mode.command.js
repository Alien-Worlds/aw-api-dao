const { ActionHandler, TraceHandler, DeltaHandler } = require('../../handlers');
const DacDirectory = require('../../dac-directory');
const { MessageService } = require('../../connections/message.service');
const { StateHistoryService } = require('../../state-history/state-history.service');
const { BlocksRange } = require('../../common/blocks-range');
const { loadConfig } = require('../../functions');
const { getBlockTimestamp } = require('../../state-history/state-history.utils');

const runFillerTestMode = async (testBlock) => {
    const config = loadConfig();
    const logger = require('../../connections/logger')('eosdac-filler', config.logger);

    logger.info(`Testing single block ${testBlock}`);

    const messageService = new MessageService(config.amq.connectionString);
    await messageService.init();

    const dacDirectory = new DacDirectory({ config });
    await dacDirectory.reload();

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

    const stateHistory = new StateHistoryService(this._config.eos);
    stateHistory.onReceivedBlock(block => {
        await processBlock(
            block,
            { traceHandler, deltaHandler}
        );
        processedBlock = block;
    });
    stateHistory.onBlockRangeComplete(async () => {
        log('Test Completed');
    });

    await stateHistory.connect();
    await stateHistory.requestBlocks(
        new BlocksRange(testBlock, testBlock + 1),
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

    if (!(blockNumber % 1000)){
        log(`StateReceiver : received block ${blockNumber}`);
        log(`Start: ${range.start}, End: ${range.end}, Current: ${blockNumber}`);
    }

    if (deltas.length > 0){
        deltaHandler.processDelta(blockNumber, deltas, abi.types, blockTimestamp);
    }

    if (traces.length > 0){
        traceHandler.processTrace(blockNumber, traces, blockTimestamp);
    }
}

module.exports = { runFillerTestMode };
