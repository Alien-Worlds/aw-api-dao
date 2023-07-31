#!/usr/bin/env node

/* istanbul ignore file */
import 'reflect-metadata';

import { DaoApi } from './api';
import { config } from './config';
import { Container } from '@alien-worlds/aw-core';
import { ApiDependencyInjector } from '@endpoints/api.ioc.config';
import { initLogger } from './connections/logger';
import { mountRoutes } from './routes';

process.title = 'aw-api-dao';

const start = async () => {
  initLogger('aw-api-dao', config.logger);

  const ioc = new Container();
  const apiDependencyInjector = new ApiDependencyInjector(ioc);
  apiDependencyInjector.setup(config);

  const api = new DaoApi(config);
  mountRoutes(api, ioc, config);
  await api.start();
};

start();
