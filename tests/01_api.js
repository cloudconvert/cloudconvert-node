var cloudconvert = require('../');

if (!process.env.API_KEY) {
    console.warn('The tests requires the API_KEY environment variable.');
}

module.exports = {


    'test if GET /conversiontypes works (no authentication required)': function (test) {
        "use strict";

        var api = new cloudconvert(process.env.API_KEY);

        api.get('/conversiontypes', {
            inputformat: 'pdf',
            outputformat: 'jpg'
        }, function(err, result) {
            test.ok(result.length > 0);
            test.done();
        });


    },

    'test if POST /process without authentication returns error': function (test) {
        "use strict";

        var api = new cloudconvert();

        api.post('/process', {
            inputformat: 'pdf',
            outputformat: 'jpg'
        }, function(err, result) {
            test.ok(err);
            test.ok(err.code == 401);
            test.done();
        });


    },

    'test if POST /process works (authentication required)': function (test) {
        "use strict";

        var api = new cloudconvert(process.env.API_KEY);

        api.post('/process', {
            inputformat: 'pdf',
            outputformat: 'jpg'
        }, function(err, result) {
            test.ok(!err);
            test.ok(result && result.url);
            test.done();
        });


    }
};