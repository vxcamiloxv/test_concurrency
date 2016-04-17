// modules/store/index.js
//
// Index for inventory module
//
// 2016, Camilo Quimbayo

(function(){
    "use strict";

    var ld = require("lodash"),
        inventoryController = require("./inventoryController"),
        InventoryModel = require("./inventoryModel"),
        inventoryRoutes = require("./inventoryRoutes");

    // Functions
    function initialize(db, app, server){
        var scheme = new InventoryModel();
        scheme.create();
        ld.forEach(inventoryRoutes, function(route, path){
            app.use("/" + path + "/", route);
        });
    }


    // Exports
    module.exports = ld.extend({
        initialize: initialize
    }, inventoryController);

})();
