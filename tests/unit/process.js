var cloudconvert = require('../../lib/api'),
    chai = require("chai"),
    nock = require('nock'),
    expect = chai.expect,
    assert = chai.assert,
    fs = require('fs'),
    stream = require('stream');


describe('Process', function () {


    beforeEach(function () {
        this.api = new cloudconvert(process.env.API_KEY);

        nock('https://api.cloudconvert.com')
            .post('/process')
            .reply(200, {
                'url': '//processurl/test'
            });
    });

    describe('#start()', function () {

        it("sends the starts process request correctly", function (done) {

            nock('https://processurl')
                .post('/test', function (body) {
                    return body.outputformat == 'jpg' && body.converteroptions.quality == 75;
                })
                .reply(200, {
                    'message': 'ok!'
                });

            this.api.createProcess({inputformat: 'png', outputformat: 'jpg'}, function (err, process) {

                process.start({
                    outputformat: 'jpg',
                    converteroptions: {
                        quality: 75
                    },
                    input: 'download',
                    file: 'https://cloudconvert.com/blog/wp-content/themes/cloudconvert/img/logo_96x60.png'
                }, function (err, process) {
                    assert(!err);
                    assert.deepPropertyVal(process, "data.message", "ok!");
                    done();

                });

            });


        });


        it("uploads the input file correctly", function (done) {

            var stringStream = new stream.Readable();
            stringStream.push('teststring');
            stringStream.push(null);

            nock('https://processurl')
                .post('/test')
                .reply(200, {
                    'url': '//processurl/test',
                    'step': 'input',
                    'message': 'waiting',
                    'upload': {
                        'url': '//processurl/test/upload'
                    }
                });

            var uploadMock = nock('https://processurl')
                .put('/test/upload/file.png', function (body) {
                    return body == 'teststring';
                })
                .reply(200, {
                    'message': 'file uploaded!'
                });


            nock('https://processurl')
                .get('/test', function () {
                    return uploadMock.isDone();
                })
                .query(true)
                .reply(200, {
                    'url': '//processurl/test',
                    'step': 'finished',
                    'message': 'done!'
                });


            this.api.createProcess({inputformat: 'png', outputformat: 'jpg'}, function (err, process) {

                process.start({
                    outputformat: 'jpg',
                    input: 'upload',
                    file: stringStream
                }, function (err, process) {
                    process.wait();
                    process.on('finished', function (data) {
                        assert.deepPropertyVal(process, "data.message", "done!");
                        done();

                    });


                });
            });


        });


    });


    describe('#wait()', function () {


        it("waits for the completion of a process", function (done) {


            nock('https://processurl')
                .post('/test')
                .reply(200, {
                    'url': '//processurl/test',
                    'step': 'input',
                    'message': 'waiting'
                });


            nock('https://processurl')
                .get('/test')
                .optionally()
                .reply(200, {
                    'url': '//processurl/test',
                    'step': 'convert',
                    'message': 'working...'
                })
                .get('/test')
                .optionally()
                .reply(200, {
                    'url': '//processurl/test',
                    'step': 'finished',
                    'message': 'done!'
                });

            nock('https://processurl')
                .get('/test')
                .optionally()
                .query({'wait': 'true'})
                .reply(200, {
                    'url': '//processurl/test',
                    'step': 'finished',
                    'message': 'done!'
                });

            this.api.createProcess({inputformat: 'png', outputformat: 'jpg'}, function (err, process) {

                process.start({
                    outputformat: 'jpg',
                    converteroptions: {
                        quality: 75,
                    },
                    input: 'download',
                    file: 'https://cloudconvert.com/blog/wp-content/themes/cloudconvert/img/logo_96x60.png'
                }, function (err, process) {

                    process.wait(function (err, process) {
                        assert(!err);
                        assert(process.data.step == 'finished');
                        done();

                    });
                });


            });


        });


    });


    describe('#on()', function () {

        it('emits "error" if conversion fails', function (done) {

            nock('https://processurl')
                .post('/test')
                .reply(200, {
                    'url': '//processurl/test',
                    'step': 'input',
                    'message': 'started'
                })
                .get('/test')
                .query(true)
                .reply(422, {
                    'url': '//processurl/test',
                    'step': 'error',
                    'message': 'failed!'
                });


            this.api.createProcess({inputformat: 'png', outputformat: 'jpg'}, function (err, process) {

                process.start({
                    outputformat: 'jpg',
                    input: 'download'
                }, function (err, process) {

                    process.wait();
                    process.on('error', function (err) {
                        assert.deepPropertyVal(err, "message", "failed!");
                        done();
                    });


                });

            });


        });


        it('emits "finished" when the conversion completes', function (done) {


            nock('https://processurl')
                .post('/test')
                .reply(200, {
                    'url': '//processurl/test',
                    'step': 'input',
                    'message': 'started'
                })
                .get('/test')
                .query(true)
                .reply(200, {
                    'url': '//processurl/test',
                    'step': 'finished',
                    'message': 'done!'
                });

            this.api.createProcess({inputformat: 'png', outputformat: 'jpg'}, function (err, process) {

                process.start({
                    outputformat: 'jpg',
                    converteroptions: {
                        quality: 75,
                    },
                    input: 'download',
                    file: 'https://cloudconvert.com/blog/wp-content/themes/cloudconvert/img/logo_96x60.png'
                }, function (err, process) {

                    process.wait();
                    process.on('finished', function (data) {
                        assert.deepPropertyVal(data, "message", "done!");
                        done();
                    });


                });

            });


        });


    });


    describe('#download()', function () {

        it('it downloads the output file', function (done) {


            nock('https://processurl')
                .post('/test')
                .reply(200, {
                    'url': '//processurl/test',
                    'step': 'input',
                    'message': 'started',
                    'output': {
                        'url': '//processurl/test/download'
                    }
                })
                .get('/test/download')
                .reply(200, "outputfile");


            this.api.createProcess({inputformat: 'png', outputformat: 'jpg'}, function (err, process) {

                process.start({
                    outputformat: 'jpg',
                    input: 'download',
                    file: 'https://cloudconvert.com/blog/wp-content/themes/cloudconvert/img/logo_96x60.png'
                }, function (err, process) {

                    process.download(fs.createWriteStream(__dirname + '/out.jpg'));
                    process.on('downloaded', function (destination) {
                        assert(fs.statSync(destination.path).size == 10);
                        done();

                        // cleanup
                        fs.unlinkSync(destination.path);
                    });


                });
            });


        });


    });


    describe('#downloadAll()', function () {

        it('it downloads all output files', function (done) {


            nock('https://processurl')
                .post('/test')
                .reply(200, {
                    'url': '//processurl/test',
                    'step': 'input',
                    'message': 'started'
                })
                .get('/test')
                .query(true)
                .reply(200, {
                    'url': '//processurl/test',
                    'step': 'finished',
                    'message': 'done!',
                    'output': {
                        'url': '//processurl/test/download',
                        'files': [
                            'input-1.jpg',
                            'input-2.jpg',
                        ]
                    }
                })
                .get('/test/download/input-1.jpg')
                .reply(200, "outputfile1")
                .get('/test/download/input-2.jpg')
                .reply(200, "out");


            this.api.convert({
                inputformat: 'pdf',
                outputformat: 'jpg',
                converteroptions: {
                    page_range: '1-2',
                }
            }).on('finished', function (data) {
                this.downloadAll(__dirname);
            }).on('downloadedAll', function (path) {
                assert(fs.statSync(path + "/input-1.jpg").size == 11);
                assert(fs.statSync(path + "/input-2.jpg").size == 3);
                done();

                // cleanup
                fs.unlinkSync(path + "/input-1.jpg");
                fs.unlinkSync(path + "/input-2.jpg");
            });


        });


    });


    describe('#pipe()', function () {


        it('converts by piping the input file', function (done) {

            var stringStream = new stream.Readable();
            stringStream.push('teststring');
            stringStream.push(null);


            nock('https://processurl')
                .post('/test')
                .reply(200, {
                    'url': '//processurl/test',
                    'step': 'input',
                    'message': 'waiting',
                    'upload': {
                        'url': '//processurl/test/upload'
                    }
                });

            var uploadMock = nock('https://processurl')
                .put('/test/upload/file.png', function (body) {
                    return body == 'teststring';
                })
                .reply(200, {
                    'message': 'file uploaded!'
                });


            nock('https://processurl')
                .get('/test', function () {
                    return uploadMock.isDone();
                })
                .query(true)
                .reply(200, {
                    'url': '//processurl/test',
                    'step': 'finished',
                    'message': 'done!',
                    'output': {
                        'url': '//processurl/test/download'
                    }
                })
                .get('/test/download')
                .reply(200, "outputfile");


            stringStream.pipe(this.api.convert({
                inputformat: 'png',
                outputformat: 'jpg',
            }).on('finished', function (data) {
                this.pipe(fs.createWriteStream(__dirname + '/out.jpg'));
            }).on('downloaded', function (destination) {
                assert(fs.statSync(destination.path).size == 10);
                done();

                // cleanup
                fs.unlinkSync(destination.path);
            }));

        });


        it('can be piped before it has finished', function (done) {


            nock('https://processurl')
                .post('/test')
                .reply(200, {
                    'url': '//processurl/test',
                    'step': 'input',
                    'message': 'waiting',
                    'upload': {
                        'url': '//processurl/test/upload'
                    }
                });


            nock('https://processurl')
                .get('/test')
                .query(true)
                .delay(1000)
                .reply(200, {
                    'url': '//processurl/test',
                    'step': 'finished',
                    'message': 'done!',
                    'output': {
                        'url': '//processurl/test/download'
                    }
                })
                .get('/test/download')
                .reply(200, "outputfile");

            this.api.convert({
                inputformat: 'png',
                outputformat: 'jpg',
            }).on('downloaded', function (destination) {
                assert(fs.statSync(destination.path).size == 10);
                done();

                // cleanup
                fs.unlinkSync(destination.path);
            }).pipe(fs.createWriteStream(__dirname + '/out.jpg'));

        });





    });


});