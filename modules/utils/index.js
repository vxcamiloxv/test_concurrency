/*global require */

// utils/index.js
//
// index function for utils
//
// 2016, Camilo Quimbayo

(function(){
    "use strict";

    var logger = require("./logger"),
        defaults = require("./defaults"),
        database = require("./database");


    // Export
    module.exports = {
        defaults: defaults,
        database: database,
        logger: logger
    };

})();
