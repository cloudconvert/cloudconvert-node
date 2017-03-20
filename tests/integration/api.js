var cloudconvert = require('../../lib/api'),
    chai = require("chai"),
    expect = chai.expect,
    assert = chai.assert;


describe('ApiIntegration', function () {



    beforeEach(function () {

        if (!process.env.API_KEY) {
            console.warn('The integration tests require the API_KEY environment variable.');
        }


    });

    describe('#get()', function () {

        it("GET /conversiontypes (no authentication required)", function (done) {

            this.api = new cloudconvert(process.env.API_KEY);
            this.api.get('/conversiontypes', {
                inputformat: 'pdf',
                outputformat: 'jpg'
            }, function(err, result) {
                assert.isArray(result);
                done();
            });

        });


    });


    describe('#post()', function () {

        it("POST /process without authentication returns error", function (done) {

            this.api = new cloudconvert();
            this.api.post('/process', {
                inputformat: 'pdf',
                outputformat: 'jpg'
            }, function(err, result) {
                assert(err);
                assert(err.code == 401);
                done();
            });

        });

        it("POST /process returns process (authentication required)", function (done) {

            this.api = new cloudconvert(process.env.API_KEY);
            this.api.post('/process', {
                inputformat: 'pdf',
                outputformat: 'jpg'
            }, function(err, result) {
                assert(!err);
                assert(result && result.url);
                done();
            });

        });


    });

    describe('#createProcess()', function () {

        beforeEach(function () {
            this.api = new cloudconvert(process.env.API_KEY);
        });


        it("creates a process object", function (done) {

            this.api.createProcess({inputformat: 'png', outputformat: 'pdf'}, function(err, process) {
                assert(!err);
                assert.instanceOf(process, require('../../lib/process'));
                assert(process.url);
                done();

            });

        });

    });


});