const { ActionHandler, TraceHandler, DeltaHandler, BlockHandler } = require('../../handlers');
const DacDirectory = require('../../dac-directory');
const StateReceiver = require('../../state-receiver');
const { MessageService } = require('../../connections/message.service');
const { loadConfig, getRestartBlock } = require('../../functions');

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

    if (startBlock <= 1 && config.eos.dacGenesisBlock) {
        startBlock = parseInt(config.eos.dacGenesisBlock);
        if (isNaN(startBlock)){
            throw new Error(`Invalid eos.dacGenesisBlock value "${config.eos.dacGenesisBlock}"`);
        }
    }

    const stateReceiver = new StateReceiver({
        startBlock,
        mode: 0,
        config,
    });

    stateReceiver.registerTraceHandler(traceHandler);
    stateReceiver.registerDeltaHandler(deltaHandler);
    stateReceiver.registerBlockHandler(blockHandler);
    stateReceiver.start();
}

module.exports = { runFillerDefaultMode };
