var Promise = require('bluebird');
var cluster = require('cluster');
var uuid = require('uuid');
var express = require('express');
var bodyParser = require('body-parser');

var ipc = require('../lib/ipc.js');
var jobModule = require('../lib/jobs.js');

if (cluster.isMaster) {
  var workers = [];

  for (var i = 0; i < 4; ++i) {
    workers.push(cluster.fork());
  }

  console.log('Forked');

  workers.forEach(function(worker) {
    ipc.setupWorker(worker);
  });

  process.on('unhandledRejection', function(err) {
    console.error(err.stack);
    process.exit(1);
  });
} else {
  (async function() {
    ipc.bindToMaster();

    await ipc.set('hits', 0);

    var app = express();

    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true, parameterLimit: 50000 }));

    app.post('/createJob', async function(req, resp) {
      console.error(new Date(), 'createJob', process.pid, req.body);

      var jobId = await jobModule.createJob(async function() {
        await Promise.delay(10000);

        return {
          success: true
        };
      });

      resp.send({
        jobId: jobId
      });
    });

    app.get('/getJob', async function(req, resp) {
      console.error(new Date(), 'getJob', process.pid, req.query.jobId, await ipc.inc('hits', 1));

      var job = await jobModule.getJob(req.query.jobId);

      if (!job) {
        resp.status(500).send({
          'error': 'Job not found ' + req.query.jobId
        });

        return;
      }

      resp.send(job);
    });

    app.listen(10000, function() {
      console.error(new Date(), 'Listening on port ' + 10000, process.pid);
    });

    process.on('unhandledRejection', function(err) {
      console.error(err.stack);
      process.exit(1);
    });
  })();
}
