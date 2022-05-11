const { BlocksRange } = require("../common/blocks-range");
const { WorkerMessage, WorkerMessageType } = require("../common/worker-message");
const { WorkerThread } = require("../common/worker-thread");
const { QueueName } = require("../connections/amq.source");
const { MessageService } = require("../connections/message.service");
const { StateHistoryService } = require("../state-history/state-history.service");
const { getBlockTimestamp, log } = require("../state-history/state-history.utils");
const { ActionHandler, TraceHandler, DeltaHandler } = require('../handlers');
const DacDirectory = require('../dac-directory');

class BlockRangeWorker extends WorkerThread {
    _messageService;
    _config;
    _dacDirectory;
    _actionHandler;
    _traceHandler;
    _deltaHandler;
    _forkHandler;
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
                QueueName.BlockRange,
                (data) => this._onReceivedBlockRange(data)
            );

            this._dacDirectory = new DacDirectory({ config: this._config });
            this._actionHandler = new ActionHandler({
                queue: this._messageService._source,
                config: this._config,
                dac_directory: this._dacDirectory,
                logger: this._logger,
            });
            this._traceHandler = new TraceHandler({
                queue: this._messageService._source,
                action_handler: this._actionHandler,
                config: this._config,
                logger: this._logger,
            });
            this._deltaHandler = new DeltaHandler({
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
            const blockRange = BlocksRange.create(message);
            await this._dacDirectory.reload();

            log('Received Block Range', blockRange.key);
            
            const stateHistory = new StateHistoryService(this._config.eos);
            stateHistory.onReceivedBlock(block => this._processBlock(block));
            stateHistory.onBlockRangeComplete(async (range) => {
                log('Completed block range', range);
                await stateHistory.disconnect();
                this._messageService.ack(message);
            });

            await stateHistory.connect();
            await stateHistory.requestBlocks(
                blockRange,
                {
                    shouldFetchTraces: !!this._traceHandler,
                    shouldFetchDeltas: !!this._deltaHandler,
                }
            );
        } catch (error) {
            this.sendToMainThread(new WorkerMessage({
                pid: this.id,
                type: WorkerMessageType.Warning,
                error,
            }));
        }
    }

    async _processBlock(blockData) {
        const { blockNumber, range, block, traces, deltas, abi } = blockData;
        const blockTimestamp = getBlockTimestamp(block);
        
        if (!(blockNumber % 1000)){
            log(`StateReceiver : received block ${blockNumber}`);
            log(`Start: ${range.start}, End: ${range.end}, Current: ${blockNumber}`);
        }
        
        if (deltas.length > 0){
            this._deltaHandler.processDelta(blockNumber, deltas, abi.types, blockTimestamp);
        }
        
        if (traces.length > 0){
            this._traceHandler.processTrace(blockNumber, traces, blockTimestamp);
        }
    }
}

module.exports = { BlockRangeWorker };
