#!/usr/bin/env node

process.title = 'eosdac-filler';

const commander = require('commander');
const { runFillerTestMode } = require('./commands/filler-test-mode.command');
const { runFillerReplayMode } = require('./commands/filler-replay-mode.command');
const { runFillerDefaultMode } = require('./commands/filler-default-mode.command');
const {
    defaultStartBlock,
    defaultTestBlock,
    defaultEndBlock,
    defaultReplayMode,
} = require('./filler.defaults');

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

const toInt = (value) => parseInt(value);

commander
    .version('0.1', '-v, --version')
    .option('-s, --start-block <start-block>', 'Start at this block', toInt, defaultStartBlock)
    .option('-t, --test <block>', 'Test mode, specify a single block to pull and process', toInt, defaultTestBlock)
    .option('-e, --end-block <end-block>', 'End block (exclusive)', toInt, defaultEndBlock)
    .option('-r, --replay', 'Force replay (ignore head block)', defaultReplayMode)
    .parse(process.argv);

start(commander);