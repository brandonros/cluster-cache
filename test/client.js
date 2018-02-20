var Promise = require('bluebird');
var uuid = require('uuid');
var rp = require('request-promise');
var async = require('async');

var ipc = require('../lib/ipc.js');

var waitForJob = async function(jobId) {
  for (;;) {
    var job = await rp.get({
      uri: `http://127.0.0.1:10000/getJob`,
      qs: {
        jobId: jobId
      },
      json: true
    });

    if (job.status !== 'running') {
      return job;
    }

    await Promise.delay(500);
  }
};

var concurrentLoop = function(arr, concurrency, fn) {
  return new Promise(function(resolve, reject) {
    async.eachOfLimit(arr, concurrency, fn, function(err) {
      if (err) {
        return reject(err);
      }

      resolve();
    });
  });
};

(async function() {
  var elements = [];

  for (var i = 0; i < 300000; ++i) {
    elements.push(i);
  }

  await concurrentLoop(elements, 256, async function(element) {
    var jobId = (await rp.post({
      uri: `http://127.0.0.1:10000/createJob`,
      json: true,
      body: {
      }
    })).jobId;

    console.log(element, jobId);

    var finishedJob = await waitForJob(jobId);

    if (finishedJob.status === 'error') {
      throw new Error(JSON.stringify({
        error: finishedJob.error,
        accountNumber: accountNumber
      }));
    }

    console.log(finishedJob);
  });
})();
