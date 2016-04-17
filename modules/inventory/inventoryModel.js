// modules/inventory/inventoryModel.js
//
// Model for inventory module
//
// 2016, Camilo Quimbayo

(function() {
    "use strict";

    var q = require("q"),
        ld = require("lodash"),
        redis = require("redis"),
        uuid = require("node-uuid"),
        appUtils = require("../utils"),

        logger = appUtils.logger,
        database = appUtils.database;

    /**
     * Inventory class constructor
     * @constructor
     */
    function Inventory(modelObj) {
    }

    // Prototype
    /**
     * @name Inventory.create
     * @description Create scheme structure
     */
    Inventory.prototype.create = function() {
        // Scheme structure
        var db = database.get(),
            log = logger.getLogger(),
            inventoryScheme = {
                inventorys: [
                    "inventorys",
                    1,
                    "Gap",
                    2,
                    "Banana Republic",
                    3,
                    "Boss",
                    4,
                    "Hugo Boss",
                    5,
                    "Taylor",
                    6,
                    "Rebecca Taylor"
                ],
                types: [
                    "types",
                    1,
                    "Denim",
                    2,
                    "Pants",
                    3,
                    "Sweaters",
                    4,
                    "Skirts",
                    5,
                    "Dresses"
                ]
            };
        ld.forEach(inventoryScheme, function(values, listName){
            db.zadd(values, function(err, res){
                if (err) {
                    log.error(err);
                    return;
                }
                log.debug("added " + res + " items.");
            });
        });
    };

    /**
     * @name Inventory.collections
     * @description Get all values
     * @param {string} name of collection
     *
     * @return {promise}
     */
    Inventory.prototype.collections = function(name) {
        var deferred = q.defer(),
            log = logger.getLogger(),
            db = redis.DB;

        try {
            db.zrange([name, 0, -1], function(err, res){
                if(err) {
                    deferred.reject({status: 500, statusText: "Internal Error", err: err});
                } else {
                    deferred.resolve({status: 200, statusText: "Success", data: res});
                }
            });
        } catch(err) {
            deferred.reject({status: 500, statusText: "Internal Error", err: err});
            log.fatal(err);
        }
        // Promise
        return deferred.promise;
    };


    // Exports
    module.exports = Inventory;


})();
