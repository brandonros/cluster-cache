var cluster = require('cluster');
var uuid = require('uuid');

var ipc = module.exports;

var cache = {};

ipc.setupWorker = function(worker) {
  worker.on('message', function(msg) {
    if (msg.cmd === 'get') {
      worker.send({id: msg.id, value: cache[msg.key] === undefined ? null : cache[msg.key]});
    } else if (msg.cmd === 'set') {
      cache[msg.key] = msg.value;

      worker.send({id: msg.id, success: true});
    } else if (msg.cmd === 'delete') {
      delete cache[msg.key];

      worker.send({id: msg.id, success: true});
    } else if (msg.cmd === 'inc') {
      cache[msg.key] += msg.value;

      worker.send({id: msg.id, value: cache[msg.key]});
    } else if (msg.cmd === 'dec') {
      cache[msg.key] -= msg.value;

      worker.send({id: msg.id, value: cache[msg.key]});
    } else if (msg.cmd === 'push') {
      cache[msg.key].push(msg.value);

      worker.send({id: msg.id, success: true});
    } else if (msg.cmd === 'pop') {
      worker.send({id: msg.id, value: cache[msg.key].pop()});
    }
  });
};

ipc.bindToMaster = function() {
  process.on('message', function(msg) {
    process.emit('message:' + msg.id, msg);
  });
};

ipc.waitForMessage = function(msgId) {
  return new Promise(function(resolve, reject) {
    process.once('message:' + msgId, resolve);
  });
};

ipc.get = async function(key) {
  var msgId = uuid.v4();

  process.send({cmd: 'get', key: key, id: msgId});

  var result = await ipc.waitForMessage(msgId);

  return result.value;
};

ipc.set = function(key, value) {
  var msgId = uuid.v4();

  process.send({cmd: 'set', key: key, value: value, id: msgId});

  return ipc.waitForMessage(msgId);
};

ipc.delete = function(key) {
  var msgId = uuid.v4();

  process.send({cmd: 'delete', key: key, id: msgId});

  return ipc.waitForMessage(msgId);
};

ipc.inc = async function(key, value) {
  var msgId = uuid.v4();

  process.send({cmd: 'inc', key: key, value: value, id: msgId});

  var result = await ipc.waitForMessage(msgId);

  return result.value;
};

ipc.dec = async function(key, value) {
  var msgId = uuid.v4();

  process.send({cmd: 'dec', key: key, value: value, id: msgId});

  var result = await ipc.waitForMessage(msgId);

  return result.value;
};

ipc.push = async function(key, value) {
  var msgId = uuid.v4();

  process.send({cmd: 'push', key: key, value: value, id: msgId});

  var result = await ipc.waitForMessage(msgId);

  return result.value;
};

ipc.pop = async function(key) {
  var msgId = uuid.v4();

  process.send({cmd: 'pop', key: key, id: msgId});

  var result = await ipc.waitForMessage(msgId);

  return result.value;
};
