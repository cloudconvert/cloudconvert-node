require = require("esm")(module, {
    'cjs': {
        'dedefault': true
    }
})
module.exports = require("./CloudConvert.js")
