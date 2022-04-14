
const Amqp = require('amqplib');

class Amq {
    constructor(config){
        this.config = config.amq;
        this.initialized = false;
        this.listeners = [];
        this.connection_errors = 0;
        this.max_connection_errors = 5;
        this.logger = require('./logger')('eosdac-amq', config.logger);
        this.reconnectHandler;
        this.disconnectHandler;
    }

    onDisconnected(handler) {
        this.disconnectHandler = handler;
    }

    onReconnected(handler) {
        this.reconnectHandler = handler;
    }

    async reconnect() {
        if (!this.initialized){
            this.logger.info(`Reloading connection with listeners`);

            try {
                await this.init();
                if (this.reconnectHandler) {
                    await this.reconnectHandler();
                }
            }
            catch (e){
                this.connection_errors++;

                const retry_ms = Math.pow(this.connection_errors, 2) * 1000;
                const log_fn = (this.connection_errors > this.max_connection_errors)?this.logger.error:this.logger.warn;
                log_fn(`${this.connection_errors} failed connection attempts, retrying in ${parseInt(retry_ms/1000)}s`, {connection_errors:this.connection_errors});

                setTimeout(() => this.reconnect(), retry_ms);

                return;
            }

            this.logger.info(`Adding ${this.listeners.length} listeners`);
            this.listeners.forEach(({queue_name, cb}) => {
                this.channel.consume(queue_name, cb, {noAck: false})
            });
        }
    }

    async init(){
        const conn = await Amqp.connect(this.config.connectionString);

        this.logger.info(`Connected to ${this.config.connectionString}`);


        const channel = await conn.createConfirmChannel();

        this.logger.info(`Channel created`);


        channel.assertQueue('block_range', {durable: true});
        channel.assertQueue('contract_row', {durable: true});
        channel.assertQueue('permission_link', {durable: true});
        channel.assertQueue('trace', {durable: true});
        channel.assertQueue('action', {durable: true});

        this.channel = channel;
        this.initialized = true;
        this.connection_errors = 0;

        conn.on('error', async (err) => {
            if (err.message !== 'Connection closing') {
                const log_fn = (this.connection_errors > this.max_connection_errors)?this.logger.error:this.logger.warn;

                log_fn('Connection Error', {e:err});
                this.initialized = false;
                if (this.disconnectHandler) {
                    await this.disconnectHandler();
                }
                this.reconnect();
            }
        });
        conn.on('close', async () => {
            this.logger.warn('Connection closed');
            this.initialized = false;
            if (this.disconnectHandler) {
                    await this.disconnectHandler();
                }
            this.reconnect();
        });
    }

    async send(queue_name, msg) {
        console.log('send to', queue_name, `| process: ${process.pid}`);
        try {
            if (!Buffer.isBuffer(msg)) {
                msg = Buffer.from(msg)
            }
            this.logger.info(`Message sent to queue ${queue_name}`);
            return this.channel.sendToQueue(queue_name, msg)
        } catch (error) {
            this.logger.error('Cannot perform operation "send", AMQ is not connected!');
            console.error(`process: ${process.pid}`, error);
        }
    }

    async listen(queue_name, cb) {
        console.log('listen to', queue_name, `| process: ${process.pid}`);
        try {
            this.channel.prefetch(1);
            // await this.channel.assertQueue(queue_name, {durable: true})
            this.listeners.push({queue_name, cb});
            this.channel.consume(queue_name, cb, {noAck: false})
        } catch (error) {
            this.logger.error('Cannot perform operation "listen", AMQ is not connected!');
            console.error(`process: ${process.pid}`, error);
        }
    }

    async ack(job) {
        console.log(`ack job | process: ${process.pid}`);
        try {
            return this.channel.ack(job);
        } catch (error) {
            this.logger.error('Cannot perform operation "ack", AMQ is not connected!');
            console.error(`process: ${process.pid}`, error);
        }
    }

    async reject(job) {
        console.log(`reject job | process: ${process.pid}`);
        try {
            return this.channel.reject(job, true);
        } catch (error) {
            this.logger.error('Cannot perform operation "reject", AMQ is not connected!');
            console.error(`process: ${process.pid}`, error);
        }
    }
}

module.exports = Amq;
