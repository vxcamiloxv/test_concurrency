// utils/defaults.js
//
// defaul app configurations
//

(function(){
    "use strict";

    var path = require("path"),
        jsonPackage = require("../../package");

    module.exports = {
        siteName: "Inventory",
        version: jsonPackage.version,
        database: {},
        host: "127.0.0.1",
        port: 2705,
        urlPort: null,
        secret: null,
        debug: false,
        nologger: false,
        logFile: null,
        logLevel: "info",
        key: null,
        cert: null,
        compression: true,
        favicon: path.resolve(__dirname, "../../public/static/favicon.ico")
    };

})();
