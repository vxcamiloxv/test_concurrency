/*global module */

// app.js
//
// main app
//
// 2016, Camilo Quimbayo

(function(){
    "use strict";


    var q = require("q"),
        fs = require("fs"),
        path = require("path"),
        swig = require("swig"),
        http = require("http"),
        https = require("https"),
        helmet = require("helmet"),
        express = require("express"),
        session = require("express-session"),
        favicon = require("serve-favicon"),
        bodyParser = require("body-parser"),
        cookieParser = require("cookie-parser"),
        RedisStore = require("connect-redis")(session),

        inventory = require("./modules/inventory"),
        concurrency = require("./modules/concurrency"),
        appUtils = require("./modules/utils"),
        logger = appUtils.logger,
        database = appUtils.database;

    function create(config){
        var deferred = q.defer(),
            server,
            app,
            serverVersion,
            address,
            baseRoute,
            noSqlClient,
            host,
            port,
            log,
            useHTTPS,
            swigCustom,
            sessionMiddleware;

        // Define basics
        port = config.port;
        host = config.hostname;
        address = config.address || host;
        config.urlHost = config.urlHost || address + (port == 443 || port == 80 ? "" : ":" + port);

        // Check port
        if(process.getuid) {
            if (port < 1024 && process.getuid() !== 0) {
                deferred.reject(new Error("Can't listen to ports lower than " +
                                          "1024 on POSIX systems unless you're root."));
                return;
            }
        }

        // Get logger instance
        log = logger.getLogger();
        log.info("Initializing Server");

        // Server start
        app = express();
        useHTTPS = config.key && config.cert;
        serverVersion = "INVENTORY/"+config.version;

        if (useHTTPS) {
            log.debug("Run over HTTPS Server.");

            config.urlHost = "https://" + config.urlHost;
            server = https.Server({key: fs.readFileSync(config.key),
                                   cert: fs.readFileSync(config.cert)}, app);
        } else {
            log.debug("Run over HTTP Server.");

            config.urlHost = "http://" + config.urlHost;
            server = http.Server(app);
        }

        // Express
        app.config = config;
        app.server = server;

        // Config render view
        config.templateOpt = {varControls: ['{{=', '=}}']};
        swigCustom = new swig.Swig(config.templateOpt);

        app.engine("html", swigCustom.renderFile);
        app.set("views", path.resolve(__dirname, "./view"));
        app.set("view engine", "html");

        // Static files
        app.use(express.static(path.resolve(__dirname, "./public"), { maxAge: 86400000 } ));
        app.use(favicon(config.favicon));


        // Databases
        // Get noSQL params and Creater Client
        config.nosql = config.nosql && config.nosql[config.env] ||  {
            port: 6379,
            host: "127.0.0.1"
        };
        noSqlClient = database.createClient(config.nosql);


        // Setup session
        sessionMiddleware = session({
            store: new RedisStore({client: noSqlClient.db, disableTTL: true}),
            secret: config.secret,
            resave: false,
            saveUninitialized: false
        });

        // Acces log
        app.use(logger.reqLogger());

        // Body parse
        app.use(bodyParser.urlencoded({extended: true}));
        app.use(bodyParser.json());

        // Some middlewares
        app.use(cookieParser());
        app.use(sessionMiddleware);

        // Secure policy
        app.use(helmet());
        app.use(helmet.hidePoweredBy({ setTo: "Camilo Quimbayo" }));

        // App locals
        app.locals.site = {
            siteName: config.siteName
        };
        app.locals.version = config.version;

        // Default data
        app.use(function(req, res, next) {

            // Defualt headers
            res.setHeader("Server", serverVersion);

            // Locals by request
            res.locals.page = {url: req.originalUrl};

            next();
        });


        // Server listen and run
        server.run = function serverRun() {
            var self = this,
                deferred = q.defer(),
                // Utils functions
                removeListeners = function() {
                    self.removeListener("listening", listenSuccessHandler);
                    self.removeListener("err", listenErrorHandler);
                },
                listenErrorHandler = function(err) {
                    removeListeners();
                    deferred.reject(err);
                },
                listenSuccessHandler = function() {
                    removeListeners();
                };

            self.on("error", listenErrorHandler);
            self.on("listening", listenSuccessHandler);


            self.listen(port, address, function() {
                // Set instance
                app.address = this.address();

                log.info("Listening on %s for host %s", port, address);

                // Connect DB
                app.db = noSqlClient.db;

                // Register base routes
                baseRoute = express.Router();
                baseRoute.get("/", function(req, res){
                    res.render("main");
                });
                app.use('/', baseRoute);

                // Load exttra modules
                concurrency.initialize(app.db, app, server);
                inventory.initialize(app.db, app, server);

                // Error Handler
                app.use(error404);
                app.use(errorHandler);

                deferred.resolve("Server runs successfully");

            });

            return deferred.promise;
        };

        /**
         * @Private
         **/

        //Server error and redirect
        function error404(req, res, next) {
            next({status: 400, statusText: "Not found"});
        }

        function errorHandler(err, req, res, next) {
            var httpCode = err.code || err.status || err.statusCode || 500,
                message =  err.message || err.description;

            if(httpCode != 404 && httpCode != 401){
                if(req.log){
                    req.log.error({err: err, req: req}, message);
                } else {
                    log.error({err: err, req: req}, message);
                }
            }

            res.json(err);
        }

        // Events
        process.on('uncaughtException', function(err) {
            log = log || console;
            log.error(err);
        });
        process.on('exit', function(code) {
            log = log || console;
            log.debug("About to exit process " + process.pid + " with code: " + code);
        });

        // Promise
        deferred.resolve(server);
        return deferred.promise;
    }

    // Exports
    module.exports = {
        create: create
    };

})();
