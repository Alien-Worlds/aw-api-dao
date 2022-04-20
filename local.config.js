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
        host: 'localhost',
        port: '3030'
    },
    ipc: {
        id: 'livenotifications',
        appspace: 'eosdac.'
    },
    eos: {
        chainId: "8be32650b763690b95b7d7e32d7637757a0a7392ad04f1c393872e525a2ce82b",
        endpoint: 'https://wax.eosdac.io/',
        wsEndpoint: 'ws://localhost:8080',
        msigContract: 'msig.world',
        dacGenesisBlock: 1,  // the first block that includes any dac contract actions including the initial setcode
        dacDirectoryContract: 'dacdirectory',
        legacyDacs: ['eos.dac'],
        dacDirectoryMode: 'all',
        dacDirectoryDacId: ''
    },
    logger: {
        level: "info",
        environment: "jungle",
        datadog: {
            apiKey: ""
        }
    }
};
