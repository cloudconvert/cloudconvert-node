# cloudconvert-node

This is the official Node.js SDK v2 for the [CloudConvert](https://cloudconvert.com/api/v2) **API v2**.

[![Node.js Run Tests](https://github.com/cloudconvert/cloudconvert-node/actions/workflows/run-tests.yml/badge.svg)](https://github.com/cloudconvert/cloudconvert-node/actions/workflows/run-tests.yml)
[![npm](https://img.shields.io/npm/v/cloudconvert.svg)](https://www.npmjs.com/package/cloudconvert)
[![npm](https://img.shields.io/npm/dt/cloudconvert.svg)](https://www.npmjs.com/package/cloudconvert)

## Installation

    npm install --save cloudconvert

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

let job = await cloudConvert.jobs.create({
    tasks: {
        'import-my-file': {
            operation: 'import/url',
            url: 'https://my-url'
        },
        'convert-my-file': {
            operation: 'convert',
            input: 'import-my-file',
            output_format: 'pdf',
            some_other_option: 'value'
        },
        'export-my-file': {
            operation: 'export/url',
            input: 'convert-my-file'
        }
    }
});
```

You can use the [CloudConvert Job Builder](https://cloudconvert.com/api/v2/jobs/builder) to see the available options for the various task types.

## Downloading Files

CloudConvert can generate public URLs for using `export/url` tasks. You can use these URLs to download output files.

```js
job = await cloudConvert.jobs.wait(job.id); // Wait for job completion

const file = this.cloudConvert.jobs.getExportUrls(job)[0];

const writeStream = fs.createWriteStream('./out/' + file.filename);

https.get(file.url, function (response) {
    response.pipe(writeStream);
});

await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
});
```

## Uploading Files

Uploads to CloudConvert are done via `import/upload` tasks (see the [docs](https://cloudconvert.com/api/v2/import#import-upload-tasks)). This SDK offers a convenient upload method:

```js
const job = await cloudConvert.jobs.create({
    tasks: {
        'upload-my-file': {
            operation: 'import/upload'
        }
        // ...
    }
});

const uploadTask = job.tasks.filter(task => task.name === 'upload-my-file')[0];

const inputFile = fs.createReadStream('./file.pdf');

await cloudConvert.tasks.upload(uploadTask, inputFile, 'file.pdf');
```
> **Note on custom streams**:
The length of the stream needs to be known prior to uploading. The SDK automatically detects the file size of file-based read streams. If you are using a custom stream, you need to pass a `filesize` as fourth parameter to the `upload()` method. 


## Websocket Events

The node SDK can subscribe to events of the [CloudConvert socket.io API](https://cloudconvert.com/api/v2/socket#socket).

```js
const job = await cloudConvert.jobs.create({ ... });

// Events for the job
// Available events: created, updated, finished, failed
cloudConvert.jobs.subscribeEvent(job.id, 'finished', event => {
    // Job has finished
    console.log(event.job);
});

// Events for all tasks of the job
// Available events: created, updated, finished, failed
cloudConvert.jobs.subscribeTaskEvent(job.id, 'finished', event => {
    // Task has finished
    console.log(event.task);
});
```

When you don't want to receive any events any more you should close the socket:

```js
cloudConvert.closeSocket();
```

## Webhook Signing

The node SDK allows to verify webhook requests received from CloudConvert.

```js
const payloadString = '...'; // The JSON string from the raw request body.
const signature = '...'; // The value of the "CloudConvert-Signature" header.
const signingSecret = '...'; // You can find it in your webhook settings.

const isValid = cloudConvert.webhooks.verify(
    payloadString,
    signature,
    signingSecret
); // returns true or false
```

## Signed URLs

Signed URLs allow converting files on demand only using URL query parameters. The node.js SDK allows to generate such URLs. Therefore, you need to obtain a signed URL base and a signing secret on the [CloudConvert Dashboard](https://cloudconvert.com/dashboard/api/v2/signed-urls).

```js
const signedUrlBase = 'https://s.cloudconvert.com/...'; // You can find it in your signed URL settings.
const signingSecret = '...'; // You can find it in your signed URL settings.
const cacheKey = 'cache-key'; // Allows caching of the result file for 24h

const job = {
    tasks: {
        'import-it': {
            operation: 'import/url',
            url: 'https://some.url',
            filename: 'logo.png'
        },
        'export-it': {
            operation: 'export/url',
            input: 'import-it',
            inline: true
        }
    }
};

const url = cloudConvert.signedUrls.sign(
    signedUrlBase,
    signingSecret,
    job,
    cacheKey
); // returns the generated URL
```

## Using the Sandbox

You can use the Sandbox to avoid consuming your quota while testing your application. The node SDK allows you to do that.

```js
// Pass `true` to the constructor
const cloudConvert = new CloudConvert('api_key', true);
```

> Don't forget to generate MD5 Hashes for the files you will use for testing.

## Setting a Region

By default, the region in your [account settings](https://cloudconvert.com/dashboard/region) is used. Alternatively, you can set a fixed region:

```js
// Pass the region as third argument to the constructor
const cloudConvert = new CloudConvert('api_key', false, 'us-east');
```

## Contributing

This section is intended for people who want to contribute to the development of this library.

### Getting started

Begin with installing the necessary dependencies by running

    npm install

in the root directory of this repository.

### Building

This project is written in TypeScript so it needs to be compiled first:

    npm run build

This will compile the code in the `lib` directory and generate a `built` directory containing the JS files and the type declarations.

### Unit Tests

Tests are based on mocha:

    npm run test

### Integration Tests

    npm run test-integration

By default, this runs the integration tests against the Sandbox API with an official CloudConvert account. If you would like to use your own account, you can set your API key using the `CLOUDCONVERT_API_KEY` enviroment variable. In this case you need to whitelist the following MD5 hashes for Sandbox API (using the CloudConvert dashboard).

    53d6fe6b688c31c565907c81de625046  input.pdf
    99d4c165f77af02015aa647770286cf9  input.png

### Linting

The project is linted by ESLint+Prettier.

If you're using VSCode, all files will be linted automatically upon saving.
Otherwise, you can lint the project by running

    npm run lint

and even auto-fix as many things as possible by running

    npm run lint -- --fix

## Resources

-   [API v2 Documentation](https://cloudconvert.com/api/v2)
-   [CloudConvert Blog](https://cloudconvert.com/blog)
