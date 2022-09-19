import { votersSchema } from '../schemas';

async function voters(fastify, request) {
	return new Promise(async (resolve, reject) => {
		const dac_config = await request.dac_config();
		const dac_id = request.dac();

		const db = fastify.mongo.db;
		const collection = db.collection('voters');

		const custodian_contract = dac_config.accounts.get(2);

		const candidate = request.query.candidate;

		fastify.log.info(
			`Getting voters for ${custodian_contract}:${dac_id}:${candidate}`
		);

		try {
			const query = { candidate, dac_id };
			const res = await collection.findOne(query);

			if (res) {
				delete res._id;
				resolve({ results: [res], count: 1 });
			} else {
				resolve({ results: [], count: 0 });
			}
		} catch (e) {
			reject(e);
		}
	});
}

module.exports = function (fastify, opts, next) {
	fastify.get(
		'/voters',
		{
			schema: votersSchema.GET,
		},
		async (request, reply) => {
			reply.send(await voters(fastify, request));
		}
	);
	next();
};
