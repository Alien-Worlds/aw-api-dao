const { Serialize } = require('eosjs');
const { TextDecoder, TextEncoder } = require('text-encoding');

const serializeMessage = (type, value, types) => {
    const buffer = new Serialize.SerialBuffer({ textEncoder: new TextEncoder, textDecoder: new TextDecoder });
    Serialize.getType(types, type).serialize(buffer, value);
    return buffer.asUint8Array();
}

const deserializeMessage = (type, array, types) => {
    const buffer = new Serialize.SerialBuffer({ textEncoder: new TextEncoder, textDecoder: new TextDecoder, array });
    let result = Serialize.getType(types, type).deserialize(buffer, new Serialize.SerializerState({ bytesAsUint8Array: true }));
    if (buffer.readPos != array.length)
        throw new Error('oops: ' + type); // todo: remove check
    return result;
}

const parseDate = (fullStr) => {
    const [fullDate] = fullStr.split('.')
    const [dateStr, timeStr] = fullDate.split('T')
    const [year, month, day] = dateStr.split('-')
    const [hourStr, minuteStr, secondStr] = timeStr.split(':')

    const dt = new Date()
    dt.setUTCFullYear(year)
    dt.setUTCMonth(month - 1)
    dt.setUTCDate(day)
    dt.setUTCHours(hourStr)
    dt.setUTCMinutes(minuteStr)
    dt.setUTCSeconds(secondStr)

    return dt.getTime()
}

const getBlockTimestamp = (block) => block 
    ? new Date(parseDate(block.timestamp.replace(['.000', '.500'], 'Z'))) 
    : new Date();

const log = (...args) => console.log(`process:${process.pid} | `, ...args);

module.exports = { serializeMessage, deserializeMessage, getBlockTimestamp, log };