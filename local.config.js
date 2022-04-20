module.exports = {
    fillClusterSize: 4,
    clusterSize: 10,
    mongo: {
        url: 'mongodb://db',
        dbName: 'eosdac',
        traceCollection: 'traces',
        stateCollection: 'states'
    },
    amq: {
        connectionString: 'amqp://guest:guest@queue_mainnet/'
    },
    ws: {
        host: 'ws',
        port: '3031'
    },
    ipc: {
        id: 'livenotifications',
        appspace: 'eosdac.'
    },
    eos: {
        // contracts: ['token.worlds', 'dao.worlds', 'msig.worlds', 'alien.worlds', 'eyeke.world', 'kavian.world', 'magor.world', 'naron.world', 'neri.world', 'veles.world'],
        chainId: "8be32650b763690b95b7d7e32d7637757a0a7392ad04f1c393872e525a2ce82b",
        // endpoint: 'http://127.0.0.1:38888',
        // wsEndpoint: 'ws://127.0.0.1:38080',
        // wsEndpoints: ['ws://127.0.0.1:38080'],
        endpoint: 'https://wax.eosdac.io',
        wsEndpoint: 'ws://waxnode-ovh-pl-01.alienworlds.io:28080',
        wsEndpoints: ['ws://waxnode-ovh-pl-01.alienworlds.io:28080'],
        msigContract: 'msig.worlds',
        custodianContract: 'dao.worlds',
        dacDirectoryContract: 'index.worlds',
        legacyDacs: ['eos.dac'],
        // the first block that includes any dac contract actions including the initial setcode
        // dao.worlds contract was first set 105376981 
        // 105578904 - first stprofile block
        // dacGenesisBlock: 123428449,
        dacGenesisBlock: 176000000,
    },
    logger: {
        level: "info",
        environment: "jungle",
        datadog: {
            apiKey: ""
        }
    }
};
