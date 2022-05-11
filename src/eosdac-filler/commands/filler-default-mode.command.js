const {
    ActionHandler,
    TraceHandler,
    DeltaHandler,
    BlockHandler,
} = require('../../handlers');
const DacDirectory = require('../../dac-directory');
const { MessageService } = require('../../connections/message.service');
const { loadConfig, getRestartBlock } = require('../../functions');
const { BlocksRange } = require('../../common/blocks-range');
const { getBlockTimestamp } = require('../../state-history/state-history.utils');
const { StateHistoryService } = require('../../state-history/state-history.service');

const runFillerDefaultMode = async (options) => {
    const config = loadConfig();
    const logger = require('../../connections/logger')('eosdac-filler', config.logger);

    const startBlock = (options.startBlock === -1)
        ? await getRestartBlock()
        : options.startBlock;

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

    const blockHandler = new BlockHandler({ config });

    let processedBlock;

    if (startBlock <= 1 && config.eos.dacGenesisBlock) {
        startBlock = parseInt(config.eos.dacGenesisBlock);
        if (isNaN(startBlock)){
            throw new Error(`Invalid eos.dacGenesisBlock value "${config.eos.dacGenesisBlock}"`);
        }
    }

    const stateHistory = new StateHistoryService(this._config.eos);
    stateHistory.onReceivedBlock(block => {
        await processBlock(
            block,
            processedBlock,
            { blockHandler, traceHandler, deltaHandler}
        );
        processedBlock = block;
    });

    await stateHistory.connect();
    await stateHistory.requestBlocks(
        new BlocksRange(startBlock),
        {
            shouldFetchTraces: true,
            shouldFetchDeltas: true,
        }
    );
}

const processBlock = async (blockData, processedBlock, handlers) => {
    const { forkHandler, deltaHandler, traceHandler } = handlers;
    const { blockNumber, range, block, traces, deltas, abi } = blockData;
    const blockTimestamp = getBlockTimestamp(block);

    if (!(blockNumber % 1000)){
        log(`StateReceiver : received block ${blockNumber}`);
        log(`Start: ${range.start}, End: ${range.end}, Current: ${blockNumber}`);
    }

    if (processedBlock && blockNumber <= processedBlock.blockNumber) {
        log(`Detected fork in serial mode: current:${blockNumber} <= head:${processedBlock.blockNumber}`)
        await forkHandler(blockNumber)
    }

    if (deltas.length > 0){
        deltaHandler.processDelta(blockNumber, deltas, abi.types, blockTimestamp);
    }

    if (traces.length > 0){
        traceHandler.processTrace(blockNumber, traces, blockTimestamp);
    }
}

module.exports = { runFillerDefaultMode };
