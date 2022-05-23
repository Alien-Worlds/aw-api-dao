const { WorkerMessage, WorkerMessageType } = require("../common/worker-message");
const { WorkerThread } = require("../common/worker-thread");
const { StateHistoryService } = require("../state-history/state-history.service");
const { log } = require("../state-history/state-history.utils");
const { ActionHandler, TraceHandler, DeltaHandler } = require('../handlers');
const { MessageService } = require('../connections/message.service');
const DacDirectory = require('../dac-directory');
const { BlockRangeRepository } = require("../common/block-range.repository");
const { BlockRangesReadTimeoutError } = require("./blockrange-worker.errors");

class BlockRangeWorker extends WorkerThread {
    _stateHistory;
    _config;
    _dacDirectory;
    _actionHandler;
    _traceHandler;
    _deltaHandler;
    _forkHandler;
    _rangeRepository;
    _logger;

    constructor(config) {
        super();
        this._config = config;
        this._logger = require('../connections/logger')('eosdac-filler', config.logger);
    }

    async _init() {
        const messageService = new MessageService(this._config.amq.connectionString);
        await messageService.init();

        this._rangeRepository = new BlockRangeRepository();
        await this._rangeRepository.init();

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
            queue: messageService._source,
            config: this._config,
            dac_directory: this._dacDirectory,
            logger: this._logger,
        });
        
        this._traceHandler = new TraceHandler({
            queue: messageService._source,
            action_handler: this._actionHandler,
            config: this._config,
            logger: this._logger,
        });
        
        this._deltaHandler = new DeltaHandler({
            queue: messageService._source,
            config: this._config,
            dac_directory: this._dacDirectory,
            logger: this._logger,
        });
    }

    async _waitUntilBlockRangesAreSet (maxAttempts = 10) {
        const { scanKey } = this._config;
        return new Promise((resolve, reject) => {
            let attempt = 1;
            const interval = setInterval(async () => {
                if (
                    await this._rangeRepository.hasUnprocessedBlockRanges(scanKey)
                ) {
                    resolve(true);
                    clearInterval(interval);
                }
                if (++attempt === maxAttempts) {
                    reject(new BlockRangesReadTimeoutError());
                    clearInterval(interval);
                }
            }, 1000);
        })
    }

    async _processBlockRange(blockRange) {
        log(`Received Block Range ${blockRange.start}-${blockRange.end} key: "${blockRange.scanKey}"`);

        await this._stateHistory.connect();
        await this._stateHistory.requestBlocks(
            blockRange,
            { shouldFetchTraces: true, shouldFetchDeltas: true },
        );
    }

    async _onReceivedBlock(block) {
        // process received block
        await this._processBlock(block);
        // find cooresponding range and update processed block number
        const { blockNumber } = block;
        await this._rangeRepository.updateProcessedBlockNumber(blockNumber);
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

    async _onBlockRangeComplete(blockRange) {
        try {
            log('Completed blocks range', blockRange);
            // disconnect state history so it can be disposed
            await this._stateHistory.disconnect();
            // Find next block range to process
            const nextBlockRange = 
                await this._rangeRepository.startNextRange();

            if (nextBlockRange) {
                await this._processBlockRange(nextBlockRange);
            } else {
                // notify main thread about task completion
                this.sendToMainThread(new WorkerMessage({
                    pid: this.id,
                    type: WorkerMessageType.NoNextBlockRangeFound,
                }));
            }
        } catch (error) {
            this.sendToMainThread(new WorkerMessage({
                pid: this.id,
                type: WorkerMessageType.Error,
                error,
            }));
        }
    }

    async start() {
        try {
            await this._init();
            await this._waitUntilBlockRangesAreSet();
            const nextBlockRange = 
                await this._rangeRepository.startNextRange();
            await this._processBlockRange(nextBlockRange);
        } catch (error) {
            this.sendToMainThread(new WorkerMessage({
                pid: this.id,
                type: WorkerMessageType.Error,
                error,
            }));
        }
    }
}

module.exports = { BlockRangeWorker };
