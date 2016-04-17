(function() {
    "use strict";

    var express = require("express"),
        inventory = require("./inventoryController"),

        api = express.Router();

    // Api
    api.get("/inventorys", inventory.getInventorys);
    api.get("/types",  inventory.getTypes);

    // Exports
    module.exports = {
        api: api
    };

})();
