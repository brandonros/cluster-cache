var Promise = require('bluebird');
var uuid = require('uuid');

var ipc = require('./ipc.js');

var jobModule = module.exports;

jobModule.createJob = async function(fn) {
  var key = uuid.v4();

  var job = {
    jobId: key,
    started: new Date().getTime(),
    status: 'running',
    output: ''
  };

  await ipc.set(key, job);

  fn()
  .then(async function(res) {
    job.finished = new Date().getTime();
    job.status = 'finished';
    job.results = res;

    await ipc.set(key, job);
  })
  .catch(async function(err) {
    console.error(err.stack);

    job.finished = new Date().getTime();
    job.status = 'error';
    job.error = err.message;
    job.stack = err.stack;

    await ipc.set(key, job);
  });

  return key;
};

jobModule.getJob = function(key) {
  return ipc.get(key);
};
