// modules/concurrency/concurrencyController.js
//
// Concurrency limiting and prioritize
//
// 2016, Camilo Quimbayo

(function() {
    "use strict";

    var ld = require("lodash");

    function ConcurrencyController(app, db, opts) {
        var maxReqBySec = 1000,
            maxConcurrentAllow = 3000,
            queueRequests = [],
            PORTION = [1000, 800, 700, 500, 400, 300, 200, 150, 50, 10],
            handleInterval = null,
            countRequest = 0;

        // Member
        return requestClient;

        // Functions
        /**
         * @name requestClient
         * @description express request middleware
         * @param {object} req client request
         * @param {object} res response for client
         * @param {function} next callback request
         *
         * @return {boolean}
         */
        function requestClient(req, res, next) {
            var expire = opts.expire || (1000),
                total = maxReqBySec,
                path = opts.path || req.path,
                method = (opts.method || req.method).toLowerCase(),
                now = Date.now(),
                log = req.log,
                lookups = "",
                middleware = ld.noop,
                resLimited = {},
                priority = 1,
                key;

            if(!handleInterval) {
                handleRequestSec();
            }
            countRequest++;
            next = next || ld.noop;

            // Not allow request if higher to concurrency
            if(countRequest >= maxConcurrentAllow) {
                next({status: 503, statusText: "Service Unavailable"});
            }
            // optional param allowing the ability to whitelist.
            if (opts.whitelist && opts.whitelist(req)) {
                return next();
            }
            // value lookup on the request object
            if(!ld.isArray(opts.lookup)) {
                opts.lookup = [opts.lookup];
            }
            if(!ld.isFunction(opts.onRateLimited)) {
                // default called when a request exceeds the configured rate limit
                opts.onConcurrentLimited = function (req, res, next) {
                    res.limit = res.limit || {};

                    resLimited = {status: 429, statusText: "Many Request"};
                    if(res.limit.remaining != -2) {
                        log.warn({concurrecy: "limiter", err: resLimited},
                                 "limiter: %s from %s", resLimited.statusText, res.limit.from);
                    }

                    next(resLimited);
                };
            }

            // Get why value look
            lookups = opts.lookup.map(function (item) {
                return item + ':' + item.split('.').reduce(function (prev, cur) {
                    return prev[cur];
                }, req);
            }).join(':');

            // construct key
            key = 'concurrentlimit:' + path + ':' + method + ':' + lookups;

            // Connect to db
            db.get(key, function (err, limit) {
                // whether errors generated from redis should allow the middleware to call next().
                // Defaults to false.
                if (err && opts.ignoreErrors) {
                    return next();
                }

                priority = definePriority(req);
                total = PORTION[priority - 1];
                // Get limit time
                now = Date.now();
                limit = limit ? JSON.parse(limit) : {
                    total: total,
                    remaining: total,
                    reset: now + expire
                };

                if (now > limit.reset) {
                    limit.reset = now + expire;
                    limit.remaining = total;
                }

                // do not allow negative remaining
                limit.remaining = Math.max(Number(limit.remaining) - 1, -2);
                db.set(key, JSON.stringify(limit), "PX", expire, function (e) {
                    res.set("X-Request-Limit", limit.total);
                    res.set("X-Request", Math.ceil(limit.reset / 1000));
                    res.set("X-Request-Remaining", Math.max(limit.remaining,0));

                    if (limit.remaining >= 0) {
                        if(priority == 1 && countRequest < maxReqBySec) {
                            next();
                        } else {
                            pushQueue(req, next, priority);
                        }
                        return;
                    }

                    // Last connection
                    limit.after = (limit.reset - Date.now()) / 1000;
                    limit.from = ld.last(lookups.split(":"));
                    res.set("Retry-After", limit.after);
                    res.limit = limit;

                    // Callback when exceeds limit
                    opts.onConcurrentLimited(req, res, next);
                });

            });
        }

        /**
         * @Private
         * @name pushQueue
         * @description append request by priority
         * @param {object} req client request
         * @param {function} next callback request
         * @param priority {int} priotiry number
         */
        function pushQueue(req, next, priority) {
            queueRequests.push({
                req: req,
                next: next,
                priority: priority
            });
            setInterval(function(){
                countRequest--;
                next();
            }, priority * 50);
        }

        /**
         * @Private
         * @name handleRequestSec
         * @description handle allow max request by second
         */
        function handleRequestSec() {
            // Clean count request
            handleInterval = setInterval(function(){
                clearInterval(handleInterval);
                handleInterval = null;
                countRequest = 0;
            }, maxReqBySec);
        }

        /**
         * @Private
         * @name definePriority
         * @description if headers not come with priority set default(2)
         * @param {object} req client request
         *
         * @return {int} priority number
         */
        function definePriority(req) {
            try {
                return parseInt(req.get("X-Priority") || 1);
            } catch(e) {
                return 10;
            }
        }
    }

    // Exports
    module.exports = ConcurrencyController;

})();
