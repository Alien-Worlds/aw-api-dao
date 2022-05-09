const { ActionHandler, TraceHandler, DeltaHandler } = require('../../handlers');
const DacDirectory = require('../../dac-directory');
const StateReceiver = require('../../state-receiver');
const { MessageService } = require('../../connections/message.service');
const { loadConfig } = require('../../functions');

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

    const stateReceiver = new StateReceiver({
        startBlock: testBlock,
        endBlock: testBlock + 1,
        mode: 1,
        config,
    });
    stateReceiver.registerTraceHandler(traceHandler);
    stateReceiver.registerDeltaHandler(deltaHandler);
    stateReceiver.registerDoneHandler(() => {
        logger.info('Test complete')
        // process.exit(0)
    });
    stateReceiver.start();
}

module.exports = { runFillerTestMode };
