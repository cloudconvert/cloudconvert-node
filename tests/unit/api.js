var cloudconvert = require('../../lib/api'),
    chai = require("chai"),
    nock = require('nock'),
    expect = chai.expect,
    assert = chai.assert;


describe('Api', function () {


    describe('#get()', function () {

        it("GET /conversiontypes (no authentication required)", function (done) {

            nock('https://api.cloudconvert.com')
                .get('/conversiontypes?inputformat=pdf&outputformat=jpg')
                .reply(200, [
                    {
                        'inputformat': 'pdf',
                        'outputformat': 'jpg',
                        'note': 'test'
                    }
                ]);

            this.api = new cloudconvert("test");
            this.api.get('/conversiontypes', {
                inputformat: 'pdf',
                outputformat: 'jpg'
            }, function (err, result) {
                assert.isArray(result);
                assert.deepPropertyVal(result, "[0].note", "test");
                done();
            });

        });


    });


    describe('#post()', function () {

        beforeEach(function () {

            nock('https://api.cloudconvert.com', {
                reqheaders: {
                    'Authorization': function (headerValue) {
                        if (headerValue == 'Bearer test') {
                            return true;
                        }
                        return false;
                    }
                }
            })
                .post('/process')
                .reply(200, {
                    'url': '//processurl'
                });

            nock('https://api.cloudconvert.com')
                .post('/process')
                .reply(401, {
                    'error': 'Api Key required'
                });

        });

        it("POST /process without authentication returns error", function (done) {

            this.api = new cloudconvert();
            this.api.post('/process', {
                inputformat: 'pdf',
                outputformat: 'jpg'
            }, function (err, result) {
                assert(err);
                assert(err.code == 401);
                done();
            });

        });

        it("POST /process returns process (authentication required)", function (done) {

            this.api = new cloudconvert('test');
            this.api.post('/process', {
                inputformat: 'pdf',
                outputformat: 'jpg'
            }, function (err, result) {
                assert(!err);
                assert(result && result.url);
                done();
            });

        });


        afterEach(function () {
            nock.cleanAll();
        });

    });

    describe('#createProcess()', function () {

        beforeEach(function () {
            this.api = new cloudconvert(process.env.API_KEY);

            nock('https://api.cloudconvert.com')
                .post('/process')
                .reply(200, {
                    'url': '//processurl'
                });

        });


        it("creates a process object", function (done) {

            this.api.createProcess({inputformat: 'png', outputformat: 'pdf'}, function (err, process) {
                assert(!err);
                assert.instanceOf(process, require('../../lib/process'));
                assert.deepPropertyVal(process, 'url', '//processurl');
                done();

            });

        });

    });


});