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

module.exports = { serializeMessage, deserializeMessage };