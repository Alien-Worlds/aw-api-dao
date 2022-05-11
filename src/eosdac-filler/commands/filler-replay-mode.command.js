const fetch = require('node-fetch');
const Int64BE = require('int64-buffer').Int64BE;
const { Api, JsonRpc } = require('@jafri/eosjs2');
const { TextDecoder, TextEncoder } = require('text-encoding');
const { loadConfig } = require('../../functions');
const { MessageService } = require('../../connections/message.service');
const { log } = require("../../state-history/state-history.utils");

const runFillerReplayMode = async (options) => {
    const config = loadConfig();
    const { startBlock = 0 } = options;

    log(`Replaying from ${startBlock} in parallel mode`);

    const rpc = new JsonRpc(config.eos.endpoint, {fetch});
    const api = new Api({
        rpc,
        signatureProvider: null,
        chainId: config.chainId,
        textDecoder: new TextDecoder(),
        textEncoder: new TextEncoder(),
    });
    
    const info = await api.rpc.get_info();
    const lastIrreversibleBlock = info.last_irreversible_block_num;

    const messageService = new MessageService(config.amq.connectionString);
    await messageService.init();
    
    const endBlock = lastIrreversibleBlock;
    const range = endBlock - startBlock;
    const defaultChunkSize = 5000;
    const chunkSizeByClusterSize = parseInt(range/ config.fillClusterSize);
    const chunkSize = Math.min(chunkSizeByClusterSize, defaultChunkSize);
    let from = parseInt(startBlock);
    let to = from + chunkSize;
    let i = 0;
    let messagesCount = 0;
    let chunksCount = parseInt(range/ chunkSize);

    // because we operate on integers, we must make sure that we send
    // the appropriate number of messages to fill the entire range
    // look for the remainder
    if (chunkSize * parseInt(endBlock / chunkSize) !== endBlock) {
        chunksCount += 1;
    }
    
    while (i < chunksCount) {
        if (to > endBlock) {
          to = endBlock;
          i = chunksCount;
        }
    
        messageService.send(
            'aw_block_range',
            Buffer.concat([
                new Int64BE(from).toBuffer(),
                new Int64BE(to).toBuffer()
            ])
        );
    
        from += chunkSize;
        to += chunkSize;
        i++;
        messagesCount++;
    }
    
    log(`Queued ${messagesCount} jobs`);
}

module.exports = { runFillerReplayMode };
