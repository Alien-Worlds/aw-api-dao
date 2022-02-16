module.exports = {
    fillClusterSize: 4,
    clusterSize: 10,
    mongo: {
        url: 'mongodb://eosdac-api-db-1:27017',
        dbName: 'eosdac',
        traceCollection: 'traces',
        stateCollection: 'states'
    },
    amq: {
        connectionString: 'amqp://user:pass@eosdac-api-queue-1/vhost'
    },
    ws: {
        host: 'eosdac-api-ws-1',
        port: '3030'
    },
    ipc: {
        id: 'livenotifications',
        appspace: 'eosdac.'
    },
    eos: {
        chainId: "8be32650b763690b95b7d7e32d7637757a0a7392ad04f1c393872e525a2ce82b",
        endpoint: 'http://lamington:8888',
        // wsEndpoint: 'ws://jungle2.eosdac.io:8080',
        msigContract: 'msigworlds',
        dacGenesisBlock: 1,  // the first block that includes any dac contract actions including the initial setcode
        dacDirectoryContract: 'dacdirectory',
        dacMsigContract: 'dacmultisigs',
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
