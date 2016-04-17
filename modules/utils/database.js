// utils/database.js
//
// database class to init, get/set model and get instance
//
// 2016, Camilo Quimbayo

(function(){
    "use strict";

    var ld = require("lodash"),
        redis = require("redis"),
        logger = require("./logger");

    // Functions

    /**
     * This represent Database class
     * @constructor
     */
    function Database(){
        this.nosql = {
            db: null,
            connect: null
        };
    }

    /**
     * Database getInstance definition
     * @return Database class
     */
    Database.getInstance = function(){
        if(!(this instanceof Database)){
            return new Database();
        }
        return this;
    };
    // Prototype
    /**
     * @name createClient
     *
     * @description Check if database are connected
     *
     * @param {Object} configSql a sql port, host, password
     *
     * @return {Object} client intance
     */
    Database.prototype.createClient = function(config) {
        var self = this,
            log = logger.getLogger(),
            connect = {},
            db = {};

        try {
            connect = redis;
            redis.DB = redis.createClient(config.port, config.host, config);
            db = redis.DB;

            if(config.database){
                db.select(config.database, function(err, success) {
                    if(err) {
                        log.error(err);
                    } else {
                        log.info("Redis connect to database %s", config.database);
                    }
                });
            }

            if(config.password) {
                db.auth(config.password, function(err, success) {
                    if(err) {
                        log.error(err);
                    } else {
                        log.info("Redis auth success");
                    }
                });
            }
            // Set instance noSql
            ld.extend(self.nosql, {
                db: db,
                connect: connect
            });

            // Events
            db.on("ready", function() {
                log.info("Run Database Adatpter: redis");
            });

            db.on("error", function(err) {
                log.error(new Error(err));
            });
        } catch(err){
            log.error(new Error(err));
        }

        return {
            db: db,
            connect: connect
        };
    };

    /**
     * @name getDatabase
     *
     * @description Get Intence of Database
     *
     * @return {object} Database instance
     */
    Database.prototype.get = function(){
        return this.nosql.db;
    };

    // Exports
    module.exports = Database.getInstance();
})();
