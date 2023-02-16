#!/usr/bin/env node
/* istanbul ignore file */

process.title = 'dao-api';

import { buildAPIServer } from './dao-api';
import { config } from './config';

const start = async () => {
	try {
		const server = await buildAPIServer();
		await server.listen(config.port, config.host);
	} catch (err) {
		console.log(err);
		process.exit(1);
	}
};

start();
