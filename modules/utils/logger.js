// utils/logger.js
//
// logger function for server
//
// 2016, Camilo Quimbayo

(function(){
    "use strict";

    // Dependencies
    var ld = require("lodash"),
        fs = require("fs"),
        path = require("path"),
        mkdirp = require('mkdirp'),
        uuid = require("node-uuid"),
        bunyan  = require("bunyan");

    // Logger basic
    var logServer = {
        name: "app",
        serializers: {
            req: bunyan.stdSerializers.req,
            res: bunyan.stdSerializers.res,
            err: function(err) {
                var obj = bunyan.stdSerializers.err(err);
                // only show properties without an initial underscore
                return ld.pick(obj, ld.filter(ld.keys(obj), function(key) { return key[0] != "_"; }));
            }
        }
    };

    // Functions

    /**
     * @name Logger
     *
     * @description This represent logger class
     * @constructor
     */
    function Logger(){
        this.config = {};
        this.log = null;
        this.weblog = null;
        this.logServer = logServer;
        this.logWeb = ld.clone(logServer);
    }

    /**
     * @name Logger.getInstance
     *
     * @description Logger getInstance definition
     *
     * @return Logger class
     */
    Logger.getInstance = function(){
        if(!(this instanceof Logger)){
            return new Logger();
        }
        return this;
    };

    // Prototype
    /**
     * @name initLogger
     *
     * @description Run intance of Logger buyan and configure morgar(express),
     * check if debug or nologger
     * @param {Object} configuration file
     *
     * @return {Object} logger intance
     */
    Logger.prototype.initLogger = function(config){
        var self = this;

        if(config){
            self.config = config;

            if (config.logPath && !config.debug && !config.nologger) {
                // ensure log path exists
                if(!fs.existsSync(config.logPath)){
                    mkdirp.sync(config.logPath);
                }

                // Set options
                self.logServer.streams = [{path: path.resolve(config.logPath, "server.log")}]; //Full log without access
                self.logWeb.streams = [{path: path.resolve(config.logPath, "access.log")}]; //Full access log


            } else if (config.nologger) {
                self.logServer.streams = [{path: "/dev/null"}];
                self.logWeb.streams = [{path: "/dev/null"}];
            } else {
                self.logServer.streams = [{stream: process.stderr}];
                self.logWeb.streams = [{stream: process.stderr}];
            }
            self.logServer.streams[0].level = config.logLevel;
            self.logWeb.streams[0].level = config.logLevel;

            // Create new logger buyan
            self.log = bunyan.createLogger(self.logServer);
            self.weblog = bunyan.createLogger(self.logWeb);

            return self.log;
        } else {
            return new Error("Need configuration for init Logger");
        }
    };

    /**
     * @name getLogger
     *
     * @description Get Intence of Logger
     *
     * @return {object} buyan logger instance
     */
    Logger.prototype.getLogger = function(){
        return this.log;
    };

    /**
     * @name reqLogger
     *
     * @description Logger for request server http or https for express 4.x
     *
     * @return {Function} logger request function
     */
    Logger.prototype.reqLogger = function(){
        var self = this;
        return function(req, res, next) {
            var rec,
                endTime,
                weblog = self.weblog.child({"req_id": uuid.v4(), component: "web"}),
                end = res.end,
                startTime = Date.now();

            req.log = weblog;
            res.end = function(chunk, encoding) {
                res.end = end;
                res.end(chunk, encoding);
                endTime = Date.now();
                rec = {req: req, res: res, serverTime: endTime - startTime};
                weblog.info(rec);
            };
            next();
        };
    };

    // Exports
    module.exports = Logger.getInstance();

})();
