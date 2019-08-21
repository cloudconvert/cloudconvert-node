# cloudconvert-node


> This is the official Node.js SDK v2 (Beta) for the [CloudConvert](https://cloudconvert.com/api/v2) _API v2_. 
> For API v1, please use [v1 branch](https://github.com/cloudconvert/cloudconvert-node/tree/v1) of this repository.

[![Build Status](https://travis-ci.org/cloudconvert/cloudconvert-node.svg?branch=master)](https://travis-ci.org/cloudconvert/cloudconvert-node)
[![npm](https://img.shields.io/npm/v/cloudconvert.svg)](https://www.npmjs.com/package/cloudconvert)
[![npm](https://img.shields.io/npm/dt/cloudconvert.svg)](https://www.npmjs.com/package/cloudconvert)

## Installation


    npm install --save cloudconvert/cloudconvert-node#v2
    
Load as ESM module:

```js
import CloudConvert from 'cloudconvert';
```

... or via require:
```js
const CloudConvert = require('cloudconvert');
```


## Creating Jobs

```js
import CloudConvert from 'cloudconvert';

const cloudConvert = new CloudConvert('api_key');

const job = await cloudConvert.jobs.create({
    'tasks': {
        'import-my-file': {
            'operation': 'import/url',
            'url': 'https://my-url'
        },
        'convert-my-file': {
            'operation': 'convert',
            'input': 'import-my-file',
            'output_format': 'pdf',
            'some_other_option': 'value'
        },
        'export-my-file': {
            'operation': 'export/url',
            'input': 'convert-my-file'
        }
    }
});
```
You can use the [CloudConvert Job Builder](https://cloudconvert.com/api/v2/jobs/builder) to see the available options for the various task types.


## Uploading Files

Uploads to CloudConvert are done via `import/upload` tasks (see the [docs](https://cloudconvert.com/api/v2/import#import-upload-tasks)). This SDK offers a convenient upload method:

```js
const job = await cloudConvert.jobs.create({
    'tasks': {
        'upload-my-file': {
            'operation': 'import/upload'          
        },
        // ...
    }
});

const uploadTask = job.tasks.filter(task => task.name === 'upload-my-file')[0];

const inputFile = fs.createReadStream('./file.pdf');

await cloudConvert.tasks.upload(uploadTask, inputFile);
```


## Downloading Files

CloudConvert can generate public URLs for using `export/url` tasks. You can use these URLs to download output files.

```js
const exportTask = job.tasks.filter(task => task.operation === 'export/url')[0];
const file = exportTask.result.files[0];

const writeStream = fs.createWriteStream('./my-output.ext');

const response = await cloudConvert.axios(file.url, {
    responseType: 'stream'
});

response.data.pipe(writeStream);

await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
});
```

## Websocket Events

The node SDK can subscribe to events of the [CloudConvert socket.io API](https://cloudconvert.com/api/v2/socket#socket).


```js
const job = await cloudConvert.jobs.create({ ... });

// Events for the job
// Available events: created, updated, finished, error, deleted
cloudConvert.jobs.subscribeEvent(job.id, 'finished', event => {
    // Job has finished
    console.log(event.job);
    
    // Job events do not contain the tasks
    // To get all tasks of the job:
    // const job = cloudConvert.jobs.get(event.job.id);
});

// Events for all tasks of the job
// Available events: created, updated, finished, error, deleted
cloudConvert.jobs.subscribeTaskEvent(job.id, 'finished', event => {
    // Task has finished
    console.log(event.task);
});
```

When you don't want to receive any events any more you should close the socket:
```js
cloudConvert.socket.close();
```

## Webhook Signing

The node SDK allows to verify webhook requests received from CloudConvert.

```js
const payloadString = '...'; // The JSON string from the raw request body.
const signature = '...'; // The value of the "CloudConvert-Signature" header.
const signingSecret = '...'; // You can find it in your webhook settings.

const isValid = cloudConvert.webhooks.verify(payloadString, signature, signingSecret); // returns true or false
```

## Unit Tests

Tests are based on mocha: 

    npm run test



## Integration Tests

    npm run test-integration
    
    
By default, this runs the integration tests against the Sandbox API with an official CloudConvert account. If you would like to use your own account, you can set your API key using the `CLOUDCONVERT_API_KEY` enviroment variable. In this case you need to whitelist the following MD5 hashes for Sandbox API (using the CloudConvert dashboard).

    53d6fe6b688c31c565907c81de625046  input.pdf
    99d4c165f77af02015aa647770286cf9  input.png
    

## Resources

* [API v2 Documentation](https://cloudconvert.com/api/v2)
* [CloudConvert Blog](https://cloudconvert.com/blog)
