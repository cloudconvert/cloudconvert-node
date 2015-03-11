var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    stream = require('stream'),
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
         source.unpipe(self);
         if(self._started) {
             throw new Error('You cannot pipe the input file after the process was already started');
         }
         if(!(source instanceof stream.Readable)) {
             throw new Error('Source stream is not a Readable stream');
         }
         self._source = source;
         if(self._startRequest) {
             self._startRequest.form().append("file", source);
             self._started = true;
         }
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
    if(self._started) {
        throw new Error('Process already started');
    }

    if((parameters.file && parameters.file instanceof stream.Readable) || self._source) {
        parameters.input = 'upload';
    }

    // cleanup parameters
    delete parameters.download;
    delete parameters.wait;


    if(parameters.input == 'upload') {
        if(parameters.file && parameters.file instanceof stream.Readable) {
            self._source = parameters.file;
        }
        delete parameters.file;
        self._startRequest = self.api.rawCall({
            method: 'POST',
            url: self.url,
            qs: parameters,
            json: true,
        }, function(error, data) {
            if (error) {
                if (callback) {
                    callback(error, self);
                } else {
                    self.emit('error', error);
                }
            } else {
                self.data = data;
                self.emit('uploaded', self.data);
                if (callback) callback(null, self);
            }
        });
        if(self._source) {
            if(!self._source.readable) {
                // already closed? open it again.
                self._source = fs.createReadStream(self._source.path);
            }
            self._startRequest.form().append("file", self._source);
            self._started = true;
        }
    } else {
        self._started = true;
        self.api.post(self.url, parameters, function(error, data) {
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
    }

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
            if(self.data.step == 'finished' && !self._finished) {
                self._finished = true;
                self.emit('finished', self.data);
            }
        }
    });

    return self;
};


/**
 * Wait until the process is finished (or ended with an error)
 *
 * @param {completedCallback} callback
 * @returns {Process}
 */

Process.prototype.wait = function(callback) {
    var self = this;

    if(self.data.step == 'finished' || self.data.step == 'error') {
        callback(null, self);
    } else {
        self.refresh({
            wait: 'true'
        }, callback);
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
    var request = self.api.get(self.data.output.url + (remotefile ? '/' + remotefile : ''))
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
    this.download(destination, null, null, options);
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

        async.each(self.data.output.files, function(file, cbeach) {

            self.download(fs.createWriteStream(path.join(outputpath, file)), file, function(err, process) {
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