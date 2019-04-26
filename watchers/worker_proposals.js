const connectMongo = require('../connections/mongo');const {loadConfig} = require('../functions');const {TextDecoder, TextEncoder} = require('text-encoding');const {Api, JsonRpc} = require('eosjs');const fetch = require('node-fetch');const MongoLong = require('mongodb').Long;const config = loadConfig();const eosTableAtBlock = require('../eos-table');class WorkerProposalsHandler {    constructor() {        this.config = loadConfig();        this.db = connectMongo(config);        this.proposals_contract = config.eos.proposalsContract || 'dacproposals';        const rpc = new JsonRpc(this.config.eos.endpoint, {fetch});        this.api = new Api({            rpc,            signatureProvider: null,            chainId: this.config.chainId,            textDecoder: new TextDecoder(),            textEncoder: new TextEncoder(),        });    }    async replay() {        const mongo = await this.db;        const db = mongo.db(this.config.mongo.dbName);        const collection = db.collection('workerproposals');        const collection_actions = db.collection('actions');        collection.createIndex({id:1, dac_scope:1, block_num:1}, {background:true, unique:true});        console.log('Removing existing entries');        await collection.deleteMany({});        const res = collection_actions.find({            'action.account': this.proposals_contract,            'action.name': 'createprop'        }).sort({block_num: 1});        let doc;        let count = 0;        console.log((await res.count()) + ' proposals found');        while (doc = await res.next()) {            await this.recalcProposal(doc);            count++        }        console.log(`Imported ${count} worker proposals`);        // process.exit(0)    }    async recalcProposal(doc) {        const mongo = await this.db;        const db = mongo.db(this.config.mongo.dbName);        const coll = db.collection('workerproposals');        const coll_actions = db.collection('actions');        if (!this.proposals_config){            const table_rows_req = {code:this.proposals_contract, scope:this.proposals_contract, table:'config'};            const dac_config = await this.api.rpc.get_table_rows(table_rows_req);            this.proposals_config = dac_config.rows[0];        }        let data = doc.action.data;        if (!data.id && !data.proposal_id){            // Old format            return;        }        // if (data.id != '671130808128338700'){        //     return;        // }        console.log('Recalc worker proposal', doc.action.data.id);        // if this is not the createprop action, then find it        if (doc.action.name !== 'createprop'){            console.log('Finding createprop action');            doc = await coll_actions.findOne({                "action.account":this.proposals_contract,                "action.name": 'createprop',                "action.data.id": data.proposal_id,                "action.data.dac_scope": data.dac_scope,                "block_num": {$lte: doc.block_num}            });            console.log('found createprop', doc);            data = doc.action.data;        }        const closing_action = await this.getClosingAction(data, db, doc.block_num);        // get votes and updates between start and end block        const is_closed = (closing_action);        let closing_block_num = 0;        if (is_closed){            closing_block_num = closing_action.block_num;        }        data.comments = await this.getComments(data, db, closing_action, doc.block_num);        data.status = await this.getStatus(data, db, closing_action);        data.votes = await this.calculateVotes(data, db, closing_block_num);        data.id = MongoLong.fromString(data.id);        data.block_num = doc.block_num;        data.block_timestamp = doc.block_timestamp;        data.trx_id = doc.trx_id;        coll.updateOne({id: data.id}, {$set:data}, {upsert:true});    }    async getComments(data, db, closing_action, start_block){        return new Promise(async (resolve, reject) => {            const comments = [];            const coll_actions = db.collection('actions');            const query = {                "action.account": this.proposals_contract,                "action.name": 'comment',                "action.data.proposal_id": data.id,                "action.data.dac_scope": data.dac_scope,                "block_num": {$gte: start_block}            };            if (closing_action){                console.log('Closing action', closing_action);                query.block_num['$lte'] = await closing_action.block_num;            }            const comments_res = coll_actions.find(query);            comments_res.forEach((comment) => {                const comment_data = {                    commenter: comment.action.data.commenter,                    comment: comment.action.data.comment,                    timestamp: comment.block_timestamp                };                comments.push(comment_data);            }, () => {                resolve(comments);            });        });    }    async getStatus(data, db, closing_action){        console.log('Update status');        const data_query = {            key: data.id        };        // get current status from the table        const table_query = {            code: this.proposals_contract,            table: 'proposals',            scope: data.dac_scope,            db,            data_query        };        if (closing_action){            table_query.block_num = closing_action.block_num;        }        const table_res = await eosTableAtBlock(table_query);        if (!table_res.count){            console.error(`Could not find state for proposal ${data.id}`);            return null;        }        const status = table_res.results[0].data.state;        return status;    }    async calculateVotes(data, db, closing_block_num){        console.log("Calculating votes", data);        // Get votes        const cat_delegates_query = {            code: this.proposals_contract,            table: 'catvotes',            scope: data.dac_scope,            db,            limit: 100        };        if (closing_block_num){            cat_delegates_query.block_num = closing_block_num;        }        const cat_delegates_res = await eosTableAtBlock(cat_delegates_query);        const indexed_cat_delegates = {};        for (let c=0;c<cat_delegates_res.results.length;c++){            const cat_data = cat_delegates_res.results[c].data;            if (data.category == cat_data.category_id){                // console.log(cat_delegates_res.results[c].data);                if (typeof indexed_cat_delegates[cat_data.delegatee] === 'undefined'){                    indexed_cat_delegates[cat_data.delegatee] = [];                }                indexed_cat_delegates[cat_data.delegatee].push(cat_data.voter);            }        }        // console.info("Indexed category delegates", indexed_cat_delegates);        const votes_query = {            code: this.proposals_contract,            table: 'propvotes',            scope: data.dac_scope,            data_query: {proposal_id: data.id},            db        };        if (closing_block_num){            votes_query.block_num = closing_block_num;        }        const votes_res = await eosTableAtBlock(votes_query);        const indexed_votes_data = {};        for (let v=0;v<votes_res.results.length;v++){            indexed_votes_data[votes_res.results[v].data.voter] = votes_res.results[v].data;        }        // console.info("Indexed votes", indexed_votes_data);        // get a list of direct voters        const direct_voters = Object.keys(indexed_votes_data);        /* Add weights from delegated votes */        for (let voter in indexed_votes_data){            // console.log(indexed_votes_data[voter], voter);            if (indexed_votes_data[voter].delegatee && indexed_votes_data.hasOwnProperty(indexed_votes_data[voter].delegatee)){                let vote_weight = indexed_votes_data[indexed_votes_data[voter].delegatee].weight || 1;                vote_weight++;                indexed_votes_data[indexed_votes_data[voter].delegatee].weight = vote_weight;                indexed_votes_data[voter].weight = 0;                // create list of delegate votes                const delegates = indexed_votes_data[indexed_votes_data[voter].delegatee].delegates || [];                const delegate_data = {                    voter,                    delegate_type: 'direct'                };                delegates.push(delegate_data);                indexed_votes_data[indexed_votes_data[voter].delegatee].delegates = delegates;                delete indexed_votes_data[voter];                continue;            }            else if (indexed_votes_data[voter].delegatee) {                indexed_votes_data[voter].weight = 0;            }            else {                indexed_votes_data[voter].weight = 1;            }            delete indexed_votes_data[voter].proposal_id;        }        // Category delegations        // console.log(indexed_cat_delegates, "Category delegations");        for (let voter in indexed_votes_data){            if (typeof indexed_cat_delegates[voter] !== 'undefined'){                indexed_cat_delegates[voter].forEach((proxying_account) => {                    if (!direct_voters.includes(proxying_account)){                        const delegates = indexed_votes_data[voter].delegates || [];                        delegates.push({                            voter: proxying_account,                            delegate_type: 'category'                        });                        indexed_votes_data[voter].delegates = delegates;                        let vote_weight = indexed_votes_data[voter].weight || 1;                        vote_weight++;                        indexed_votes_data[voter].weight = vote_weight;                    }                });            }        }        console.log("votes data", indexed_votes_data);        const vote_totals = {            proposal_approve: 0,            proposal_deny: 0,            finalize_approve: 0,            finalize_deny: 0        };        for (let voter in indexed_votes_data){            switch (indexed_votes_data[voter].vote){                case 1:                    vote_totals.proposal_approve += indexed_votes_data[voter].weight;                    break;                case 2:                    vote_totals.proposal_deny += indexed_votes_data[voter].weight;                    break;                case 3:                    vote_totals.finalize_approve += indexed_votes_data[voter].weight;                    break;                case 4:                    vote_totals.finalize_deny += indexed_votes_data[voter].weight;                    break;            }        }        return {totals: vote_totals, details:Object.values(indexed_votes_data)};    }    async getClosingAction(data, db, start_block){        const coll_actions = db.collection('actions');        // Find the closing actions to get the range for this proposal        // this is in case there are more than one proposal with the same id        const closing_actions = ['arbapprove', 'finalize', 'cancel'];        const closing_res = coll_actions.find({            "action.account":this.proposals_contract,            "action.name": {$in:closing_actions},            "action.data.proposal_id": data.id,            "action.data.dac_scope": data.dac_scope,            "block_num": {$gte: start_block}        });        return await closing_res.next();    }    async action(doc) {        if (doc.action.account === this.proposals_contract){            console.log('Reacting to proposals action');            // delay to wait for the state to update            setTimeout((() => {                this.recalcProposal(doc);            }), 600)        }    }}module.exports = new WorkerProposalsHandler();