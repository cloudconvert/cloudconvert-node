var cloudconvert = require('../');
var fs = require('fs');

if (!process.env.API_KEY) {
    console.warn('The tests requires the API_KEY environment variable.');
}

module.exports = {

    'test if process creation works': function (test) {
        "use strict";

        var api = new cloudconvert(process.env.API_KEY);

        api.createProcess({inputformat: 'png', outputformat: 'pdf'}, function(err, process) {
            test.ok(!err);
            test.ok(process.url);
            test.done();

        });


    },



    'test if process start with input method "download" works': function (test) {
        "use strict";


        var api = new cloudconvert(process.env.API_KEY);

        api.createProcess({inputformat: 'png', outputformat: 'jpg'}, function(err, process) {

            process.start({
                outputformat: 'jpg',
                converteroptions: {
                    quality : 75
                },
                input: 'download',
                file: 'https://cloudconvert.com/blog/wp-content/themes/cloudconvert/img/logo_96x60.png'
            }, function (err, process) {
                test.ok(!err);
                test.ok(process.data);
                test.done();

                // cleanup
                process.delete();
            });
        });


    },


    'test if process wait for completion works': function (test) {
        "use strict";

        var api = new cloudconvert(process.env.API_KEY);

        api.createProcess({inputformat: 'png', outputformat: 'jpg'}, function(err, process) {

            process.start({
                outputformat: 'jpg',
                converteroptions: {
                    quality : 75,
                },
                input: 'download',
                file: 'https://cloudconvert.com/blog/wp-content/themes/cloudconvert/img/logo_96x60.png'
            }, function (err, process) {

                process.wait(function (err, process) {
                    test.ok(!err);
                    test.ok(process.data.step == 'finished');
                    test.done();

                    // cleanup
                    process.delete();
                });
            });
        });


    },

    'test if process emits "error" if conversion failes ': function (test) {
        "use strict";

        var api = new cloudconvert(process.env.API_KEY);

        api.createProcess({inputformat: 'png', outputformat: 'jpg'}, function(err, process) {

            process.start({
                outputformat: 'jpg',
                converteroptions: {
                    quality : 75,
                },
                input: 'download',
                file: 'http://notexisting'
            }, function (err, process) {

                process.wait();
                process.on('error', function(err) {
                    test.ok(err);
                    test.done();

                    // cleanup
                    process.delete();
                });


            });
        });


    },

    'test if process emits "finished" if conversion is finished': function (test) {
        "use strict";

        var api = new cloudconvert(process.env.API_KEY);

        api.createProcess({inputformat: 'png', outputformat: 'jpg'}, function(err, process) {

            process.start({
                outputformat: 'jpg',
                converteroptions: {
                    quality : 75,
                },
                input: 'download',
                file: 'https://cloudconvert.com/blog/wp-content/themes/cloudconvert/img/logo_96x60.png'
            }, function (err, process) {

                process.wait();
                process.on('finished', function(data) {
                    test.ok(data.step == 'finished');
                    test.done();

                    // cleanup
                    process.delete();
                });


            });
        });


    },


    'test if download of the output file works': function (test) {
        "use strict";

        var api = new cloudconvert(process.env.API_KEY);

        api.createProcess({inputformat: 'png', outputformat: 'jpg'}, function(err, process) {

            process.start({
                outputformat: 'jpg',
                input: 'download',
                file: 'https://cloudconvert.com/blog/wp-content/themes/cloudconvert/img/logo_96x60.png'
            }, function (err, process) {

                process.download(fs.createWriteStream(__dirname  +  '/out.jpg'));
                process.on('downloaded', function(destination) {
                    test.ok(fs.statSync(destination.path).size > 0);
                    test.done();

                    // cleanup
                    process.delete();
                    fs.unlinkSync(destination.path);
                });


            });
        });


    },


    'test if upload of the input file works': function (test) {
        "use strict";

        var api = new cloudconvert(process.env.API_KEY);

        api.createProcess({inputformat: 'png', outputformat: 'jpg'}, function(err, process) {

            process.start({
                outputformat: 'jpg',
                input: 'upload',
                converteroptions: {
                    quality : 51,
                },
                file: fs.createReadStream(__dirname  + '/input.png')
            }, function (err, process) {
                process.wait();
                process.on('finished', function(data) {
                    test.ok(data.converter.options.quality == 51);
                    test.done();

                    // cleanup
                    process.delete();
                });


            });
        });


    },

    'test if .convert() works': function (test) {
        "use strict";

        var api = new cloudconvert(process.env.API_KEY);

        fs.createReadStream(__dirname  + '/input.png').pipe(api.convert({
            inputformat: 'png',
            outputformat: 'jpg',
        }).on('finished', function(data) {
            this.pipe(fs.createWriteStream(__dirname  + '/out.jpg'));
        }).on('downloaded', function(destination) {
            test.ok(fs.statSync(destination.path).size > 0);
            test.done();

            // cleanup
            this.delete();
            fs.unlinkSync(destination.path);
        }));


    },


    'test if download of multiple output files works': function (test) {
        "use strict";

        var api = new cloudconvert(process.env.API_KEY);

        fs.createReadStream(__dirname  + '/input.pdf').pipe(api.convert({
            inputformat: 'pdf',
            outputformat: 'jpg',
            converteroptions: {
                page_range : '1-2',
            }
        }).on('finished', function(data) {
            this.downloadAll(__dirname);
        }).on('downloadedAll', function(path) {
            test.ok(fs.statSync(path + "/input-0.jpg").size > 0);
            test.ok(fs.statSync(path + "/input-1.jpg").size > 0);
            test.done();

            // cleanup
            this.delete();
            fs.unlinkSync(path + "/input-0.jpg");
            fs.unlinkSync(path + "/input-1.jpg");
        }));


    }



};