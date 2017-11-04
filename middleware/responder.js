/**
 * Middleware to send response back to client.
 */
let bunyan = require('bunyan');
let moment = require('moment');


/**
 * Depends on the type of error object, send the JSON response to the client.
 *
 * @method responder
 * @param requestResult {Object}
 * @param request {Request} express request object.
 * @param response {Request} express response object.
 * @param next {Function} express next function.
 */
function responder(requestResult, request, response, next) {
    let context = request.context || {};
    let config = context.config || {};
    let logger = context.logger || bunyan.createLogger({
        name: "campus portal",
        level: "debug",
        pid: process.pid
    });
    let serverCurrentTime = moment().format('YYYY-MM-DDTHH:mm:ssZ');
    let body = {};
    let isV2 = request.originalUrl.indexOf('v2') !== -1;
    let responseCode = 200;

    // set server current time
    response.set('X-SERVER-CURRENT-TIME', serverCurrentTime);
    if (process.env.NODE_ENV !== 'production') {
        body.request = {
            method: request.method,
            href: request.originalUrl,
            headers: request.headers,
            parameters: request.query,
            body: request.body
        };
    }
    // Skip if no request result object found
    if (!requestResult) {
        next(null);
        return;
    }

    if (typeof requestResult === 'string') {
        requestResult = new Error(requestResult);
    }

    if (requestResult instanceof Error) {
        responseCode = 200;

        logger.debug("Error message: ", requestResult.message);
        logger.debug("Error stack: ", requestResult.stack);
        //401错误要返回
        logger.debug("requestResult.name:", requestResult.name);
        logger.debug("requestResult.code:", requestResult.code);

        if(requestResult.name === 'OAuth2Error') {
            responseCode = 401;
        } else if(requestResult.statusCode && (requestResult.statusCode > 400 && requestResult.statusCode < 500)) {
            responseCode = requestResult.statusCode;
        }

        body.meta = {
            'x-server-current-time' : serverCurrentTime,
            code: requestResult.statusCode
        };

        if (process.env.NODE_ENV !== 'production') {
            body.meta.error = {
                'error-code' : requestResult.errorCode,
                message : requestResult.message || '',
				'developer-message' : requestResult['developer-message'] || '',
                stack : requestResult.stack || ''
            };
        } else {
            body.meta.error = {
                'error-code' : requestResult.errorCode,
                message : (requestResult.errorCode || requestResult.statusCode !== 500) ? (requestResult.message || '') : 'Operation failed.'
            };
        }

        if (requestResult.data) {
            body.meta.error.data = requestResult.data;
        }

        body.code = 1;
        body.isSuc = false;
        body.message = requestResult.message || '';

        response.status(responseCode).json(body);

        if(_utils.inProdMode){
            logger.debug("==>response: %j", body);
        }else{
            logger.debug("==>response:", JSON.stringify(body, null, 2));
        }

        if(request.context && request.context.requestTime) {
            logger.debug(`used time: ${new Date() - request.context.requestTime} millisecond.`);
        }
        return;
    }

    responseCode = requestResult.statusCode || 200;
    body.code = 1;
    body.isSuc = true;
    body.result = requestResult.body || null;

    body.meta = {
        'x-server-current-time' : serverCurrentTime,
        code: requestResult.statusCode || 200
    };

    logger.debug('Sending response to client:');
    logger.debug('statusCode: %s', requestResult.statusCode);

    if (requestResult.headers) {
        logger.debug('Headers: %j', requestResult.headers || {});
    }

    if (requestResult.headers) {
        response.set(requestResult.headers);
    }

    response.status(responseCode).json(body);
    if(_utils.inProdMode){
        logger.debug("==>response: %j", body);
    }else{
        logger.debug("==>response:", JSON.stringify(body, null, 2));
    }

    if(request.context && request.context.requestTime) {
        logger.debug(`used time: ${new Date() - request.context.requestTime} millisecond.`);
    }
}

module.exports = responder;
