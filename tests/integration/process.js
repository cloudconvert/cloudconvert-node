var cloudconvert = require('../../lib/api'),
    chai = require("chai"),
    expect = chai.expect,
    assert = chai.assert,
    fs = require('fs'),
    stream = require('stream');


describe('ProcessIntegration', function () {

    this.timeout(30000);

    beforeEach(function () {

        if (!process.env.API_KEY) {
            console.warn('The integration tests require the API_KEY environment variable.');
        }
        this.api = new cloudconvert(process.env.API_KEY);
    });

    describe('#start()', function () {

        it("starts a process with input method 'download'", function (done) {

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
                    assert(process.data);
                    done();

                    // cleanup
                    process.delete();
                });
            });


        });


        it("starts a process with input method 'upload'", function (done) {


            this.api.createProcess({inputformat: 'png', outputformat: 'jpg'}, function (err, process) {

                process.start({
                    outputformat: 'jpg',
                    input: 'upload',
                    converteroptions: {
                        quality: 51,
                    },
                    file: fs.createReadStream(__dirname + '/input.png')
                }, function (err, process) {
                    process.wait();
                    process.on('finished', function (data) {
                        assert(data.converter.options.quality == 51);
                        done();

                        // cleanup
                        process.delete();
                    });


                });
            });


        });


    });


    describe('#wait()', function () {


        it("waits for the completion of a process", function (done) {

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

                        // cleanup
                        process.delete();
                    });
                });


            });


        });


    });


    describe('#on()', function () {

        it('emits "error" if conversion fails', function (done) {

            this.api.createProcess({inputformat: 'png', outputformat: 'jpg'}, function (err, process) {

                process.start({
                    outputformat: 'jpg',
                    converteroptions: {
                        quality: 75,
                    },
                    input: 'download',
                    file: null //wrong!
                }, function (err, process) {

                    process.wait();
                    process.on('error', function (err) {
                        assert(err);
                        done();

                        // cleanup
                        process.delete();
                    });


                });

            });


        });


        it('emits "finished" when the conversion completes', function (done) {

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
                        assert(data.step == 'finished');
                        done();

                        // cleanup
                        process.delete();
                    });


                });

            });


        });


    });


    describe('#download()', function () {

        it('it downloads the output file', function (done) {

            this.api.createProcess({inputformat: 'png', outputformat: 'jpg'}, function (err, process) {

                process.start({
                    outputformat: 'jpg',
                    input: 'download',
                    file: 'https://cloudconvert.com/blog/wp-content/themes/cloudconvert/img/logo_96x60.png'
                }, function (err, process) {

                    process.download(fs.createWriteStream(__dirname + '/out.jpg'));
                    process.on('downloaded', function (destination) {
                        assert(fs.statSync(destination.path).size > 0);
                        done();

                        // cleanup
                        process.delete();
                        fs.unlinkSync(destination.path);
                    });


                });
            });


        });


    });



    describe('#downloadAll()', function () {

        it('it downloads all output files', function (done) {

            fs.createReadStream(__dirname  + '/input.pdf').pipe(this.api.convert({
                inputformat: 'pdf',
                outputformat: 'jpg',
                converteroptions: {
                    page_range : '1-2',
                }
            }).on('finished', function(data) {
                this.downloadAll(__dirname);
            }).on('downloadedAll', function(path) {
                assert(fs.statSync(path + "/input-1.jpg").size > 0);
                assert(fs.statSync(path + "/input-2.jpg").size > 0);
                done();

                // cleanup
                this.delete();
                fs.unlinkSync(path + "/input-1.jpg");
                fs.unlinkSync(path + "/input-2.jpg");
            }));


        });


    });



    describe('#pipe()', function () {


        it('converts by piping the input file', function (done) {

            fs.createReadStream(__dirname  + '/input.png').pipe(this.api.convert({
                inputformat: 'png',
                outputformat: 'jpg',
            }).on('finished', function(data) {
                this.pipe(fs.createWriteStream(__dirname  + '/out.jpg'));
            }).on('downloaded', function(destination) {
                assert(fs.statSync(destination.path).size > 0);
                done();

                // cleanup
                this.delete();
                fs.unlinkSync(destination.path);
            }));

        });


        it('can be piped before it has finished', function (done) {


            fs.createReadStream(__dirname  + '/input.png').pipe(this.api.convert({
                inputformat: 'png',
                outputformat: 'jpg',
            }).on('downloaded', function(destination) {
                assert(fs.statSync(destination.path).size > 0);
                done();

                // cleanup
                this.delete();
                fs.unlinkSync(destination.path);
            })).pipe(fs.createWriteStream(__dirname  + '/out.jpg'));

        });





        it('a non file stream can be piped', function (done) {


            var stringStream = new stream.Readable();
            stringStream.push('<html><head></head><body><h1>test</h1></body></html>');
            stringStream.push(null);


            stringStream.pipe(this.api.convert({
                inputformat: 'html',
                outputformat: 'pdf',
            }).on('downloaded', function(destination) {
                assert(fs.statSync(destination.path).size > 0);
                done();

                // cleanup
                this.delete();
                fs.unlinkSync(destination.path);
            })).pipe(fs.createWriteStream(__dirname  + '/out.pdf'));


        });



    });



});