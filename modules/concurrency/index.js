// modules/store/index.js
//
// Index for concurrency module
//
// 2016, Camilo Quimbayo

(function(){
    "use strict";

    var ld = require("lodash"),
        concurrencyController = require("./concurrencyController");

    // Functions
    function initialize(db, app, server){
        var concurrencyMiddleware = concurrencyController(app, db, {
            lookup: "connection.remoteAddress"
        });

        app.use(concurrencyMiddleware);
    }


    // Exports
    module.exports = ld.extend({
        initialize: initialize
    }, concurrencyController);

})();
