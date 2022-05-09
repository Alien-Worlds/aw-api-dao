const { BlocksRange } = require("../common/blocks-range");
const { WorkerMessage, WorkerMessageType } = require("../common/worker-message");
const { WorkerThread } = require("../common/worker-thread");
const { QueueName } = require("../connections/amq.source");
const { MessageService } = require("../connections/message.service");
const { StateHistoryService } = require("../state-history/state-history.service");
const { ActionHandler, TraceHandler, DeltaHandler } = require('../handlers');
const DacDirectory = require('../dac-directory');

class FillerWorker extends WorkerThread {
    _messageService;
    _config;
    _dacDirectory;
    _actionHandler;
    _traceHandler;
    _deltaHandler;
    _logger;

    constructor(config) {
        super();
        this._config = config;
        this._messageService = new MessageService(config.amq.connectionString);
        this._logger = require('../connections/logger')('eosdac-filler', config.logger);
    }

    async start() {
        try {
            await this._messageService.init();
            this._messageService.addListener(
                QueueName.AlienWorldsBlockRange,
                (data) => this._onReceivedBlockRange(data)
            );

            _dacDirectory = new DacDirectory({ config: this._config });
            _actionHandler = new ActionHandler({
                queue: this._messageService._source,
                config: this._config,
                dac_directory: this._dacDirectory,
                logger: this._logger,
            });
            _traceHandler = new TraceHandler({
                queue: this._messageService._source,
                actionHandler,
                config: this._config,
                logger: this._logger,
            });
            _deltaHandler = new DeltaHandler({
                queue: this._messageService._source,
                config: this._config,
                dac_directory: this._dacDirectory,
                logger: this._logger,
            });
        } catch (error) {
            this.sendToMainThread(new WorkerMessage({
                pid: this.id,
                type: WorkerMessageType.Error,
                error,
            }));
        }
    }

    async _onReceivedBlockRange(message) {
        try {
            await this._dacDirectory.reload(); 

            const blockRange = BlocksRange.fromMessage(message);
            const stateHistory = new StateHistoryService(this._config.eos);
            stateHistory.onReceivedBlock(block => this._processBlock(block));
            stateHistory.onBlockRangeComplete(() => {
                await stateHistory.disconnect();
                this._messageService.ack(message);
            });

            await stateHistory.connect();

            stateHistory.requestBlocks(blockRange);
        } catch (error) {
            this.sendToMainThread(new WorkerMessage({
                pid: this.id,
                type: WorkerMessageType.Warning,
                error,
            }));
        }
    }

    async _processBlock(data) {
        const { blockNumber, block, traces, deltas, abi } = data;
        const blockTimestamp = block ? new Date(this.parseDate(block.timestamp.replace(['.000', '.500'], 'Z'))) : new Date();

        if (deltas.length > 0){
            this._deltaHandler.processDelta(blockNumber, deltas, abi.types, blockTimestamp)
        }

        if (traces.length > 0){
            this._traceHandler.processTrace(blockNumber, traces, blockTimestamp)
        }
    }
}

module.exports = { FillerWorker };
