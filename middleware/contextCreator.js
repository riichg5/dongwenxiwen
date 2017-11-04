/**
 * Returns a connect middleware function which creates a new context
 * object for each request.
 *
 * This function takes an optional defaults object and copy its properties into
 * the newly created context object.
 *
 * context.result:  will store the request result from database, memcache, and etc.
 * context.user:    will store distributorId, userId, deviceId, and etc.
 *
 * @method context
 * @param defaults {Object} Default context content, optional.
 * @return {Function} connect middle-ware which generate context.
 */
function context(defaults) {
    if (typeof defaults === 'undefined') {
        defaults = {};
    }

    if (typeof defaults !== 'object') {
        throw new Error('defaults needs to be a valid object');
    }

    // Return the middleware
    return function (request, response, next) {
        if (!request.context) {
            request.context = {};
            Object.keys(defaults).forEach(function (key) {
                request.context[key] = defaults[key];
            });
            // request.context.remoteAddress = _utils.getClientIp(request);
            request.context.clientId = request.get('x-client-id');
            request.context.companyCode = 'CUIT'; //request.get('x-company-code');
            request.context.session = request.session;
            request.context.data = {};
        }
        request.context.requestTime = new Date();
        next();
        // _utils.startContext(request.context, next);
    };
}

module.exports = context;
