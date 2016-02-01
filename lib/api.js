var request = require('request'),
    Process = require('./process.js'),
    extend = require('util')._extend;

/**
 * Constructor for the API Wrapper
 *
 * @param {String} apiKey You can get it here: https://cloudconvert.com/user/profile
 * @constructor
 */
function Api(apiKey) {
    this.apiKey = apiKey;
    this.endpoint = 'api.cloudconvert.com';
    this.protocol = 'https';
}

/**
 * Making a raw API call using request module
 *
 * @param {Object} options options for request
 * @param {requestCallback} callback The callback that handles the response
 * @returns {Request}
 */
Api.prototype.rawCall = function(options, callback) {

    if(this.apiKey) {
        options.auth = {
            'bearer': this.apiKey
        };
    }

    if(options.url.indexOf('//')===0) {
        options.url = this.protocol + ':' + options.url;
    } else if(options.url.indexOf('http')!==0) {
        options.url = this.protocol + '://' + this.endpoint + options.url;
    }

    return request(options, function(error, response, body) {
        if((body && body.error) || (response && response.statusCode >= 400 )) {
            // error from API
            var apierror = new Error(body.error || body.message);
            apierror.code = response.statusCode;
            if(response.headers['retry-after'])
                apierror.retryAfter = response.headers['retry-after'];
            if(callback)
                callback(apierror, null);
        } else {
            if(callback)
                callback(error, body);
        }
    });

};
/**
 * @callback requestCallback
 * @param {Error} error if request failed
 * @param {Object} response body
 */

/**
 * HTTP GET
 *
 * @param {String} url
 * @param {Object} content The query paramters
 * @param {requestCallback} callback The callback that handles the response
 * @returns {Request}
 */
Api.prototype.get = function(url, content, callback) {
    var options = {
        method: 'GET',
        url: url,
        qs: content,
        json: true
    };

    return this.rawCall(options, callback);

};

/**
 * HTTP POST
 *
 * @param {String} url
 * @param {Object} content The POST body
 * @param {requestCallback} callback The callback that handles the response
 * @returns {Request}
 */
Api.prototype.post = function(url, content, callback) {
    var options = {
        method: 'POST',
        url: url,
        json: content
    };

    return this.rawCall(options, callback);

};

/**
 * HTTP DELETE
 *
 * @param {String} url
 * @param {Object} content The query paramters
 * @param {requestCallback} callback The callback that handles the response
 * @returns {Request}
 */
Api.prototype.delete = function(url, content, callback) {
    var options = {
        method: 'DELETE',
        url: url,
        qs: content,
        json: true
    };

    return this.rawCall(options, callback);

};


/**
 * HTTP PUT
 *
 * @param {String} url
 * @param {Object} content The query paramters
 * @param {requestCallback} callback The callback that handles the response
 * @returns {Request}
 */
Api.prototype.put = function(url, content, callback) {
    var options = {
        method: 'PUT',
        url: url,
        json: content
    };

    return this.rawCall(options, callback);

};



/**
 *
 * @param parameters see https://cloudconvert.com/apidoc#create
 * @param {completedCallback} callback
 * @returns {Process}
 */
Api.prototype.createProcess = function(parameters, callback) {
    var process = new Process(this);
    process.create(parameters, callback);
    return process;
};
/**
 * @callback completedCallback
 * @param {Error} error if request failed
 * @param {Process} process
 */


/**
 * Shortcut: Creates a process, starts it and waits for its completion
 *
 * @param parameters see https://cloudconvert.com/apidoc#create, https://cloudconvert.com/apidoc#start
 * @param {completedCallback} callback
 * @returns {Process}
 */
Api.prototype.convert = function(parameters, callback) {
    var process = new Process(this);

    var createparamters = extend({}, parameters);
    delete createparamters.file;

    process.create(createparamters, function(err, process) {
        if(err) {
            if(callback) {
                callback(err, process);
            } else {
                process.emit('error', err);
            }
        } else {
            process.start(parameters, function(err, process) {
                if(err) {
                    if(callback) {
                        callback(err, process);
                    } else {
                        process.emit('error', err);
                    }
                } else {
                    process.wait(function(err, process) {
                        if(err) {
                            if(callback) {
                                callback(err, process);
                            } else {
                                process.emit('error', err);
                            }
                        } else {
                            if(callback)
                                callback(null, process);
                        }
                    });
                }
            });
        }
    });
    return process;
};


module.exports = Api;