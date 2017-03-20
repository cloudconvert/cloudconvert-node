var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    stream = require('stream'),
    PauseStream = require('pause-stream'),
    fs = require('fs'),
    path = require('path'),
    async = require('async');

/**
 *
 * @param {Api} api
 * @param {String} url Process URL (if created already)
 * @constructor
 */
function Process(api, url) {
    this.api = api;
    this.url = url;
    this.data = {};
    this.init();
}

util.inherits(Process, EventEmitter);

Process.prototype.init = function() {
    var self = this;

     self.on('pipe', function (source) {

         self.upload(source);
         source.unpipe(self);


    });


    return self;
};




/**
 * create Process on API
 *
 * @param parameters see https://cloudconvert.com/apidoc#create
 * @param {completedCallback} callback
 * @returns {Process}
 */
Process.prototype.create = function(parameters, callback) {
    var self = this;
    self.inputformat = parameters.inputformat;
    self.outputformat = parameters.outputformat;
    self.api.post('/process', parameters, function(error, data) {
        if (error) {
            if (callback) {
                callback(error, self);
            } else {
                self.emit('error', error);
            }
        } else {
            self.url = data.url;
            if (callback) callback(null, self);
        }
    });
    return self;
};
/**
 * @callback completedCallback
 * @param {Error} error if request failed
 * @param {Process} process
 */


/**
 * start Process
 *
 * @param {Object} parameters see https://cloudconvert.com/apidoc#start
 * @param {completedCallback} callback
 * @returns {Process}
 */
Process.prototype.start = function(parameters, callback) {
    var self = this;
    if(!self.url) {
        throw new Error('Process not created yet');
    }

    if((parameters.file && parameters.file instanceof stream.Readable) || self._source) {
        parameters.input = 'upload';
    }

    // cleanup parameters
    delete parameters.download;
    delete parameters.wait;


    if(parameters.input == 'upload' && parameters.file) {
        self.upload(parameters.file);
        delete parameters.file;

    }

        self.api.post(self.url, parameters, function(error, data) {
            if (error) {
                if (callback) {
                    callback(error, self);
                } else {
                    self.emit('error', error);
                }
            } else {
                self.data = data;
                self.emit('started', self.data);
                if (callback) callback(null, self);
            }
        });


    return self;
};

/**
 * Refresh process object from API
 *
 * @param {Object} paramters
 * @param {completedCallback} callback
 * @returns {Process}
 */

Process.prototype.refresh = function(parameters, callback) {
    var self = this;

    if(!self.url) {
        throw new Error('Process not created yet');
    }

    self.api.get(self.url, parameters, function(error, data) {
        if (error) {
            if (callback) {
                callback(error, self);
            } else {
                self.emit('error', error);
            }
        } else {
            self.data = data;
            if (callback) callback(null, self);
            self.emit('progress', self.data);
            if(self.data.step == 'finished' && !self._finished) {
                self._finished = true;
                self.emit('finished', self.data);
            }
        }
    });

    return self;
};



/**
 * Upload file to API
 *
 * @param {String} filename input filename of uploaded file
 * @param {Stream} stream source stream for upload
 * @param {completedCallback} callback
 * @returns {Process}
 */

Process.prototype.upload = function(source, filename, callback) {
    var self = this;


    if(!self.url || !self.data || !self.data.step) {
        // process not started yet
        // pause stream and upload as soon as possible

        var pauseStream = PauseStream();
        source.pipe(pauseStream.pause());

        if(source.path) {
            // remember path in such that we can progress information later
            pauseStream.path = source.path;
        }

        self.once('started', function(data) {
            self.upload(pauseStream, filename, callback);
        });
        return self;


    } else if(typeof self.data.upload == 'undefined') {
        throw new Error('Uploads are not allowed in this process state');
    }


    if(!filename) {
        if(source.path) {
            filename = path.basename(source.path);
        } else if(self.inputformat) {
            filename = "file." + self.inputformat;
        } else {
            throw new Error('Upload filename not set');
        }
    }


    self.data.message = "Uploading input file";

    var request = self.api.put(self.data.upload.url + "/" + encodeURIComponent(filename), null, function(error, data) {
        if (error) {
            if (callback) {
                callback(error, self);
            } else {
                self.emit('error', error);
            }
        } else {
            self.emit('uploaded', self.data);
            if (callback) callback(null, self);
        }
    });
    if(source) {


        if(source.path) {
            // get stream progress, if possible
            var stat = fs.statSync(source.path);

            var totalsize = stat.size;
            var writesize = 0;
            source.on("data", function (data) {
                writesize +=data.length;
                self.data.message = "Uploading " + source.path;
                self.data.percent = writesize / totalsize * 100;
                self.emit('progress', self.data);
            });
        }

        source.pipe(request);
        if(source.paused) {
            source.resume();
        }


    }

    return self;
};



/**
 * Wait until the process is finished (or ended with an error)
 *
 * @param {completedCallback} callback
 * @returns {Process}
 */

Process.prototype.wait = function(callback, interval) {
    var self = this;

    interval= interval || 1000;

    if(self.data.step == 'finished' || self.data.step == 'error') {
        callback(null, self);
    } else {

        var callbackCalled = false;

        self.refresh({
            wait: 'true'
        }, function(error, process) {
            clearInterval(checkInterval);
            if(callbackCalled) {
                return;
            }
            if(callback) {
                callback(error, process);
            } else if(error) {
                self.emit('error', error);
            }
            callbackCalled = true;
        });

        var checkInterval = setInterval(function() {
            self.refresh({}, function(error, process) {
                if(self.data.step == 'finished' || self.data.step == 'error') {
                    clearInterval(checkInterval);
                    if(callbackCalled) {
                        return;
                    }
                    if(callback) {
                        callback(error, process);
                    } else if(error) {
                        self.emit('error', error);
                    }
                    callbackCalled = true;
                }
            });
        }, interval);
    }

    return self;
};


/**
 * Delete process object from API
 *
 * @param {Object} paramters
 * @param {completedCallback} callback
 * @returns {Process}
 */

Process.prototype.delete = function(parameters, callback) {
    var self = this;

    if(!self.url) {
        throw new Error('Process not created yet');
    }

    self.api.delete(self.url, parameters, function(error, data) {
        if (error) {
            if (callback) {
                callback(error, self);
            } else {
                self.emit('error', error);
            }
        } else {
            self.data = data;
            if (callback) callback(null, self);
        }
    });

    return self;
};

/**
 * Download output file to destination
 *
 * @param {WriteableStream} destination
 * @param {String} remotefile Remote file name which should be downloaded (if there are
 *         multiple output files available)
 * @param {completedCallback} callback
 * @param {Object} pipeoptions
 * @returns {Process}

 */
Process.prototype.download = function(destination, remotefile, callback, pipeoptions) {
    var self = this;
    if(!self.data.output || !self.data.output.url) {
        throw new Error('Output not (yet) available');
    }
    var request = self.api.get(self.data.output.url + (remotefile ? '/' + encodeURIComponent(remotefile) : ''))
        .on('response', function(response) {
            if (response.headers['content-length']) {
                var totalsize = parseInt(response.headers['content-length']);
                var writesize = 0;
                response.on("data", function (data) {
                    writesize +=data.length;
                    self.data.message = "Downloading " + destination.path;
                    self.data.percent = writesize / totalsize * 100;
                    self.emit('progress', self.data);
                });
            }
        })
        .pipe(destination, pipeoptions)
        .on('finish', function() {
            self.emit('downloaded', destination);
            if(callback) callback(null, self);
        })
        .on('error', function(err) {
            if(callback) {
                callback(err, self);
            } else {
                self.emit('error', err);
            }
        });
    return self;
};

/**
 * Pipe the output file
 *
 * @param {WriteableStream} destination
 * @param {Object} options
 * @returns {WriteableStream}
 */
Process.prototype.pipe = function(destination, options) {
    var self = this;
    if(!self.data.output || !self.data.output.url) {
      self.once('finished', function() { self.download(destination, null, null, options); });
      self.once('error', function(error) { destination.emit('error', error); });
    } else {
      self.download(destination, null, null, options);
    }
    return destination;
};


/**
 * Download all output files to destination path
 *
 * @param {String} path
 * @param {completedCallback} callback
 * @returns {Process}

 */
Process.prototype.downloadAll = function(outputpath, callback) {
    var self = this;
    if(!outputpath)
        outputpath = '.';
    outputpath = path.normalize(outputpath);

    if (self.data.output && self.data.output.files) {

        async.eachSeries(self.data.output.files, function(file, cbeach) {

            var destinationPath = path.join(outputpath, file);

            // create the destination folder if it does not exist
            if(!fs.existsSync(path.dirname(destinationPath))) {
                fs.mkdirSync(path.dirname(destinationPath));
            }

            self.download(fs.createWriteStream(destinationPath), file, function(err, process) {
                if(err) {
                    cbeach(err);
                } else {
                    cbeach();
                }
            });

        }, function(err){
            // if any of the file processing produced an error, err would equal that error
            if( err ) {
                if (callback) {
                    callback(err, self);
                } else {
                    self.emit('error', err);
                }
            } else {
                if(callback)
                    callback(null, self);
                self.emit('downloadedAll', outputpath);
            }
        });

    } else if (self.data.output && self.data.output.filename) {
        // only 1 output file
        self.download(fs.createWriteStream(path.join(outputpath, self.data.output.filename)), null, function(err, process) {
            if(err) {
                if (callback) {
                    callback(err, self);
                } else {
                    self.emit('error', err);
                }
            } else {
                if(callback)
                    callback(null, self);
                self.emit('downloadedAll', outputpath);
            }
        });
    } else {
        throw new Error('Output not (yet) available');
    }
    return self;
};

module.exports = Process;
