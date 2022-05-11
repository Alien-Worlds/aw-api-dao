#!/usr/bin/env node

process.title = 'eosdac-filler';

const commander = require('commander');
const { runFillerTestMode } = require('./commands/filler-test-mode.command');
const { runFillerReplayMode } = require('./commands/filler-replay-mode.command');
const { runFillerDefaultMode } = require('./commands/filler-default-mode.command');

const start = async (options) => {

    const { replay, test } = options;

    if (test) {
        return runFillerTestMode(test);
    }

    if (replay) {
        return runFillerReplayMode(options);
    }

    return runFillerDefaultMode(options);
}

commander
    .version('0.1', '-v, --version')
    .option('-s, --start-block <start-block>', 'Start at this block', -1)
    .option('-t, --test <block>', 'Test mode, specify a single block to pull and process', parseInt, 0)
    .option('-e, --end-block <end-block>', 'End block (exclusive)', parseInt, 0xffffffff)
    .option('-r, --replay', 'Force replay (ignore head block)', false)
    .parse(process.argv);

start(commander);