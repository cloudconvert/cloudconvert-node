cloudconvert-node
=======================
This is a lightweight wrapper for the [CloudConvert](https://cloudconvert.com) API.

Feel free to use, improve or modify this wrapper! If you have questions contact us or open an issue on GitHub.


[![Build Status](https://travis-ci.org/cloudconvert/cloudconvert-node.svg?branch=master)](https://travis-ci.org/cloudconvert/cloudconvert-node)
[![npm](https://img.shields.io/npm/v/cloudconvert.svg)](https://www.npmjs.com/package/cloudconvert)
[![npm](https://img.shields.io/npm/dt/cloudconvert.svg)](https://www.npmjs.com/package/cloudconvert)

Installation
-------------------
As usual:

    npm install --save cloudconvert
    

Quickstart
-------------------
```js
var fs = require('fs');
var cloudconvert = new (require('cloudconvert'))('your_api_key');

fs.createReadStream('tests/input.png')
.pipe(cloudconvert.convert({
    inputformat: 'png',
    outputformat: 'jpg',
    converteroptions: {
        quality : 75,
    }
 }))
.pipe(fs.createWriteStream('out.jpg'))
.on('finish', function() {
    console.log('Done!');
});
```
You can use the [CloudConvert API Console](https://cloudconvert.com/apiconsole) to generate ready-to-use JS code snippets using this wrapper.



The manual way
-------------------
``cloudconvert.convert()`` creates a Process, start it and waits until it completes. In some cases it might be necessary that you do this steps seperately, as the following example shows:

```js

var fs = require('fs');
var cloudconvert = new (require('cloudconvert'))('your_api_key');

// create the process. see https://cloudconvert.com/apidoc#create
cloudconvert.createProcess({inputformat: 'png', outputformat: 'pdf'}, function(err, process) {

    if(err) {
        console.error('CloudConvert Process creation failed: ' + err);
    } else {

        // start the process. see https://cloudconvert.com/apidoc#create
        process.start({
            outputformat: 'jpg',
            converteroptions: {
                quality : 75,
            },
            input: 'upload'
        }, function (err, process) {

            if (err) {
                console.error('CloudConvert Process start failed: ' + err);
            } else {

                // upload the input file. see https://cloudconvert.com/apidoc#upload
                process.upload(fs.createReadStream('tests/input.png'), null, function (err, process) {

                    if (err) {
                        console.error('CloudConvert Process upload failed: ' + err);
                    } else {
                        // wait until the process is finished (or completed with an error)
                        process.wait(function (err, process) {
                            if (err) {
                                console.error('CloudConvert Process failed: ' + err);
                            } else {
                                console.log('Done: ' + process.data.message);

                                // download it
                                process.download(fs.createWriteStream("out.jpg"), null, function (err, process) {
                                    if (err) {
                                        console.error('CloudConvert Process download failed: ' + err);
                                    } else {
                                        console.log('Downloaded to out.jpg');
                                    }
                                });
                            }

                        });
                    }
                });


            }
        });
    }

});
```


Download of multiple output files
-------------------

In some cases it might be possible that there are multiple output files (e.g. converting a multi-page PDF to JPG). You can download them all to one directory using the ``downloadAll()`` method.

```js
var fs = require('fs');
var cloudconvert = new (require('cloudconvert'))('your_api_key');

fs.createReadStream('tests/input.pdf').pipe(cloudconvert.convert({
    inputformat: 'pdf',
    outputformat: 'jpg',
    converteroptions: {
        page_range : '1-3',
    }
}).on('error', function(err) {
    console.error('Failed: ' + err);
}).on('finished', function(data) {
    console.log('Done: ' + data.message);
    this.downloadAll('tests/');
}).on('downloaded', function(destination) {
    console.log('Downloaded to: ' + destination.path);
}).on('downloadedAll', function(path) {
    console.log('Downloaded all to: ' + path);
}));

```


Events
-----------------
The ``Process``object emits the following Events:

Event|Description
------|------------
``error``| The conversion failed. You should always listen for this event: If there is no listener, the error will be thrown and might crash your application.
``finished``| The conversion is finished (but **not** yet downloaded). This event will only be emitted, if you do ``wait()`` for the process. (``convert()`` does this automatically for you).
``progress``|Emitted every second with the current progress of the conversion. This event will only be emitted, if you do ``wait()`` for the process. 
``uploadeded``|The input file was uploaded.
``started``|The process was started.
``downloaded``|The output file was downloaded.
``downloadedAll``|Emitted after  completed ``downloadAll()``. Every single file will emit a seperate ``downloaded`` event.


Error handling
-----------------
The following example shows how to catch the different error types which can occur at conversions:

```js
var fs = require('fs');
var cloudconvert = new (require('cloudconvert'))('your_api_key');

fs.createReadStream('tests/input.pdf').pipe(cloudconvert.convert({
    inputformat: 'pdf',
    outputformat: 'jpg',
}).on('error', function(err) {
    switch (err.code) {
        case 400:
            console.error('Something with your request is wrong: ' + err);
            break;
        case 422:
            console.error('Conversion failed, maybe because of a broken input file: ' + err);
            break;
        case 503:
            console.error('API temporary unavailable: ' + err);
            console.error('We should retry the conversion in ' + err.retryAfter + ' seconds');
            break;
        default:
            // network problems, etc..
            console.error('Something else went wrong: ' + err);
            break;
    }
}).on('finished', function(data) {
    console.log('Done: ' + data.message);
}));

```



How to run tests?
-----------------

Tests are based on mocha: 

    git https://github.com/cloudconvert/cloudconvert-node.git
    cd cloudconvert-node
    npm install -d
    npm test



How to run integration tests?
-----------------

By default, mocha does not run integration tests against the real CloudConvert API. To run integration tests, use the `API_KEY` enviroment variable and run the integration tests:

    git https://github.com/cloudconvert/cloudconvert-node.git
    cd cloudconvert-node
    npm install -d
    export API_KEY="your_api_key"
    npm run integration
    

Resources
---------

* [API Documentation](https://cloudconvert.com/api)
* [Conversion Types](https://cloudconvert.com/formats)
* [CloudConvert Blog](https://cloudconvert.com/blog)
