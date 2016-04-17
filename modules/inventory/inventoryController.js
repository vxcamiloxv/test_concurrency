(function() {
    "use strict";

    var InventoryModel = require("./inventoryModel");


    // Functions
    function getInventorys(req, res, next){
        var inventory = new InventoryModel();

        inventory.collections("inventorys").then(function(data){
            res.json(data);
        }).catch(function(err){
            next(err);
        });
    }

    function getTypes(req, res, next){
        var inventory = new InventoryModel();

        inventory.collections("types").then(function(data){
            res.json(data);
        }).catch(function(err){
            next(err);
        });
    }

    // Exports
    module.exports = {
        getInventorys: getInventorys,
        getTypes: getTypes
    };

})();
