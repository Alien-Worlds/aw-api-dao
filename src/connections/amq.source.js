const { connect, Message } = require('amqplib');

const wait = async (ms) => new Promise(resolve => setTimeout(resolve, ms));
const log = (...args) => console.log(`process:${process.pid} | `, ...args);


class ChannelCancelledError extends Error {
  constructor(data) {
    super(`Channel cancelled by the server: ${data}`);
  }
}

const QueueName = {
  Action: 'action',
  AlienWorldsBlockRange: 'aw_block_range',
  RecalcAsset: 'recalc_asset',
}

const AmqConnectionState = {
  Online: 'online',
  Offline: 'offline',
  Connecting: 'connecting',
  Disconnecting: 'disconnecting',
}


/**
 * Represents Amq driver.
 * 
 * @class
 */
class AmqSource {
  _logger;
  _channel;
  _connection;
  _connectionState = AmqConnectionState.Offline;
  _initialized;
  _connectionErrorsCount;
  _maxConnectionErrors;
  _handlersByQueue;
  _address;
  _onConnectedHandler;
  _onDisconnectedHandler;
  _connectionError;

  /**
   * Creates instances of the Amq class
   * 
   * @constructor
   * @param {string} address - connection string
   * @param {Console} logger - logger instance
   */
  constructor(address, logger) {
    this._address = address;
    this._initialized = false;
    this._handlersByQueue = new Map();
    this._connectionErrorsCount = 0;
    this._maxConnectionErrors = 5;
    this._logger = logger;
  }

  _handleConnectionBlocked(reason) {
    log(`Connection blocked: ${reason}`);
  }
  
  _handleConnectionUnblocked() {
    log('Connection unblocked');
  }

  /**
   * Reconnect to server
   * 
   * This function is called when the connection is closed.
   * 
   * @private
   * @async
   */
  async _handleConnectionClose() {
    log('Connection closed');

    if (this._connectionState === AmqConnectionState.Disconnecting) {
      this._connectionState = AmqConnectionState.Offline;

      if (this._onDisconnectedHandler) {
        await this._onDisconnectedHandler(this._connectionError);
        this._connectionError = null;
      }

      await this._reconnect();
    }
  }

  /**
   * Logs a connection error and tries to reconnect.
   * This function is called when there is a connection error.
   *
   * @private
   * @async
   * @param {Error} error
   */
  async _handleConnectionError(error) {
    if (error.message !== 'Connection closing') {
      this._connectionError = error;
      this._connectionErrorsCount++;
        
      log('Connection Error', { e: error });

      if (this._connectionErrorsCount > this._maxConnectionErrors) {
        // log it somewhere 
      }
    }
  }

  _handleChannelCancel(reason) {
    log(`Channel Cancel ${reason}`);
    if (this._connectionState === AmqConnectionState.Online) {
      this._disconnect(new ChannelCancelledError(reason));
    }
  }

  _handleChannelClose() {
    log(`Channel Close`);
    if (this._connectionState === AmqConnectionState.Online) {
      this._disconnect();
    }
  }

   _handleChannelError(error) {
    log(`Channel Error ${error.message}`);
    if (this._connectionState === AmqConnectionState.Online) {
      this._disconnect(error);
    }
  }

  _disconnect(reason) {
    if (this._connectionState === AmqConnectionState.Online) {
      this._connectionState = AmqConnectionState.Disconnecting;
      if (reason) {
        this._connectionError = reason;
      }
      this._connection.close();
    }
  }

  /**
   * Reconnect to server and reassign queue handlers.
   * This function is called when the connection is lost
   * due to an error or closure.
   * 
   * After a failed connection attempt, the function calls
   * itself after a specified time.
   *
   * @private
   * @async
   */
  async _reconnect() {
    if (this._connectionState === AmqConnectionState.Offline) {
      this._initialized = false;
      this._logger.info(`Reloading connection with handlers`);
      
      try {
        await this.init();
        await this._reassignHandlers();
      } catch (e) {
        this._connectionErrorsCount++;
        const retryMs = Math.pow(this._connectionErrorsCount, 2) * 1000;
        await wait(retryMs);
        await this._reconnect();
      }
    }
  }

  /**
   * Reassign queue handlers available in the 'handlers' map.
   * This function is called when the connection is restored
   * 
   * @private
   * @async
   */
  async _reassignHandlers() {
    const promises = [];
    this._handlersByQueue.forEach((handlers, queue) => {
      handlers.forEach(handler =>
        promises.push(
          this._channel.consume(queue, handler, {
            noAck: false,
          })
        )
      );
    });

    log(`Reassign handlers x${promises.length}`);

    await Promise.all(promises);
  }

  /**
   * Create channel and set up queues.
   * 
   * @private
   * @async
   */
  async _createChannel() {
      this._channel = await this._connection.createChannel();
      this._channel.on('cancel', (data) => this._handleChannelCancel(data));
      this._channel.on('close', () => this._handleChannelClose());
      this._channel.on('error', (error) => this._handleChannelError(error));

      log(`Channel created.`);

      await this._channel.prefetch(1);
      await this._channel.assertQueue(QueueName.Action, { durable: true });
      await this._channel.assertQueue(QueueName.AlienWorldsBlockRange, {
        durable: true,
      });
      await this._channel.assertQueue(QueueName.RecalcAsset, { durable: true });

      this._logger.info(`Queues set up.`);
  }

  /**
   * Connect to server
   * 
   * @private
   * @async
   */
  async _connect() {
    if (this._connectionState !== AmqConnectionState.Offline) {
      return;
    }

    this._connectionState = AmqConnectionState.Connecting;
    this._connection = await connect(this._address);
    this._connection.on('error', (error) => this._handleConnectionError(error));
    this._connection.on('close', () => this._handleConnectionClose());
    this._connection.on("blocked", (reason) => this._handleConnectionBlocked(reason));
    this._connection.on("unblocked", () => this._handleConnectionUnblocked());

    this._connectionState = AmqConnectionState.Online;

    this._logger.info(`Connected to AMQ ${this._address}`);

  }

  /**
   * @readonly
   * @returns {boolean}
   */
  get isInitialized() {
    return this._initialized;
  }

  onConnected(handler) {
    this._onConnectedHandler = handler;
  }
  
  onDisconnected(handler) {
    this._onDisconnectedHandler = handler;
  }

  /**
   * Initialize driver
   *
   * @async
   */
  async init() {
    if (this._initialized) {
      log(`AMQ is already initialized`);
      return;
    }

    await this._connect();
    await this._createChannel();

    this._initialized = true;
    this._connectionErrorsCount = 0;

    if (this._onConnectedHandler) {
      await this._onConnectedHandler();
    }
  }

  /**
   * Send a single message with the content given as a buffer to the specific queue named, bypassing routing.
   *
   * @param {string} queue
   * @param {Buffer} message
   * @param {Function} callback
   */
  async send(queue, message) {
    try {
      return this._channel.sendToQueue(queue, message);
    } catch (error) {
      log(`ERROR: Failed to send message`, error);
    }
  }

  /**
   * Set up a listener for the queue.
   *
   * @param {string} queue - queue name
   * @param {QueueHandler} handler - queue handler
   */
  addListener(queue, handler) {
    try {
      const list = this._handlersByQueue.get(queue);
      if (list) {
          list.push(handler);
      } else {
        this._handlersByQueue.set(queue, [handler]);
      }
      this._channel.consume(queue, (message) => handler(message), { noAck: false });
    } catch (error) {
      log(`ERROR: Failed to add listener`, error);
    }
  }

  /**
   * Acknowledge the given message, or all messages up to and including the given message.
   *
   * @param {Message} message
   */
  async ack(message) {
    try {
      return this._channel.ack(message);
    } catch (error) {
      log(`ERROR: Failed to ack message`, error);
    }
  }

  /**
   * Reject a message.
   *
   * @param {Message} message
   */
  async reject(message) {
    try {
      return this._channel.reject(message, true);
    } catch (error) {
      log(`ERROR: Failed to reject message`, error);
    }
  }
}

module.exports = {
    AmqSource,
    ChannelCancelledError,
    QueueName,
    AmqConnectionState,
};
