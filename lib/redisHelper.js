/**
 * Redis helper
 */
let Promise = require('bluebird');
const safeJsonStringify = require('safe-json-stringify');
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.(\d*))?Z$/;

function get(context, key, callback) {
    var client = context.redisClient,
        logger = context.logger,
        appName = context.appName,
        stat;

    if (!client) {
        callback(null, null);
        return;
    }

    if (appName) {
        key = appName + '.' + key;
    }

    logger.debug("Getting from redis for key '%s'.", key);
    client.get(key, function (error, result) {
        if (error) {
            logger.warn(
                "Failed to read key '%s' from redis: %s",
                key,
                error.stack || error.message
            );
            callback(error);
            return;
        }

        if (!result) {
            logger.trace(
                "Found no result for key '%s' in redis.",
                key
            );
            callback(null, null);
            return;
        }

        result = JSON.parse(result, function (k, v) {
            if (typeof v === 'string') {
                var m = ISO_DATE.exec(v);
                if (m) {
                    return new Date(
                        Date.UTC(
                            +m[1],
                            +m[2] - 1,
                            +m[3],
                            +m[4],
                            +m[5],
                            +m[6],
                            +m[8]
                        )
                    );
                }
            }
            return v;
        });

        // logger.trace(
        //     'Found (key: %s, value: %j) pair in redis.',
        //     key,
        //     result
        // );
        callback(null, result);
    });
}


function set(context, key, value, ttl, callback) {
    var client = context.redisClient,
        logger = context.logger,
        appName = context.appName,
        stat;

    if (!client) {
        callback();
        return;
    }

    if (appName) {
        key = appName + '.' + key;
    }

    logger.trace("Storing to redis for key '%s'.", key);
    client.set(
        key,
        // JSON.stringify(value),
        safeJsonStringify(value),
        function (error, result) {
            if (error) {
                logger.warn(
                    "Failed to store data into redis '%s'.",
                    error.stack || error.message
                );
                callback(error);
                return;
            }

            logger.trace('Stored (key: %s) pair into redis.', key);
            callback();
        }
    );
    if (ttl > 0) {
        client.expire(key, ttl);
    }
}


function del(context, key, callback) {
    var client = context.redisClient,
        logger = context.logger,
        appName = context.appName,
        stat;

    if (!client) {
        callback();
        return;
    }

    if (appName) {
        key = appName + '.' + key;
    }

    logger.trace("Deleting key '%s' from redis", key);
    client.del(
        key,
        function (error) {
            if (error) {
                logger.warn(
                    'Failed to delete key from redis: %s',
                    error.stack || error.message
                );
                callback(error);
                return;
            }

            logger.trace(
                "Key '%s' deleted from redis.",
                key
            );
            callback();
        }
    );
}

module.exports = {
    get: get,
    set: set,
    del: del,
    pGet: Promise.promisify(get),
    pSet: Promise.promisify(set),
    pDel: Promise.promisify(del)
};
