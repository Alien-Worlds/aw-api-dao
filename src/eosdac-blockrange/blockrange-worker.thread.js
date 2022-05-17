const { BlocksRange } = require("../common/blocks-range");
const { WorkerMessage, WorkerMessageType } = require("../common/worker-message");
const { WorkerThread } = require("../common/worker-thread");
const { QueueName } = require("../connections/amq.source");
const { MessageService } = require("../connections/message.service");
const { StateHistoryService } = require("../state-history/state-history.service");
const { log } = require("../state-history/state-history.utils");
const { ActionHandler, TraceHandler, DeltaHandler } = require('../handlers');
const DacDirectory = require('../dac-directory');

class BlockRangeWorker extends WorkerThread {
    _messageService;
    _stateHistory;
    _currentMessage;
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

            this._stateHistory = new StateHistoryService(this._config.eos);
            this._stateHistory.onReceivedBlock(
                async (block) => this._onReceivedBlock(block)
            );
            this._stateHistory.onBlockRangeComplete(
                async (blockRange) =>
                    this._onBlockRangeComplete(blockRange)
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

            if (this._currentMessage) {
                throw new Error(`Received unexpected message`);
            }

            this._currentMessage = message;
            await this._dacDirectory.reload();

            log('Received Block Range', blockRange.key);
            
            await this._stateHistory.connect();
            await this._stateHistory.requestBlocks(
                blockRange,
                { shouldFetchTraces: true, shouldFetchDeltas: true }
            );
        } catch (error) {
            this.sendToMainThread(new WorkerMessage({
                pid: this.id,
                type: WorkerMessageType.Warning,
                error,
            }));
        }
    }

    async _onReceivedBlock(block) {
        // process received block
        await this._processBlock(block);
        // notify main thread about processed block
        const { startBlock, endBlock, blockNumber, queueKey } = block;

        this.sendToMainThread(new WorkerMessage({
            pid: this.id,
            type: WorkerMessageType.ProcessedBlock,
            content: new BlocksRange(
                startBlock,
                endBlock,
                queueKey,
                blockNumber).toJson(),
        }));
    }

    async _processBlock(blockData) {
        const {
            blockNumber,
            startBlock,
            endBlock,
            traces,
            deltas,
            abi,
            blockTimestamp,
        } = blockData;
        
        if (!(blockNumber % 1000)){
            log(`StateReceiver : received block ${blockNumber}`);
            log(`Start: ${startBlock}, End: ${endBlock}, Current: ${blockNumber}`);
        }
        
        if (deltas.length > 0){
            this._deltaHandler.processDelta(blockNumber, deltas, abi.types, blockTimestamp);
        }
        
        if (traces.length > 0){
            this._traceHandler.processTrace(blockNumber, traces, blockTimestamp);
        }
    }

    async _onBlockRangeComplete(blocksRange) {
        log('Completed blocks range', blocksRange);
        // disconnect state history so it can be disposed
        await this._stateHistory.disconnect();
        // ack message to release this consumer/worker
        this._messageService.ack(this._currentMessage);
        this._currentMessage = null;
        // notify main thread about task completion
        this.sendToMainThread(new WorkerMessage({
            pid: this.id,
            type: WorkerMessageType.Complete,
            content: blocksRange.toJson(),
        }));
    }
}

module.exports = { BlockRangeWorker };
