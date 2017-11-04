// Return the middleware
let BLL = require(_base + 'bll');

function requestLogger(request, response, next) {
    let context = request.context;
    let logger = context.logger;
    let requestData = {
        ip: request.ip,
        method: request.method,
        href: request.originalUrl,
        headers: request.headers,
        parameters: request.query,
        body: request.body,
        query: request.query
    };


    if (_utils.inProdMode) {
        requestData.body = _.omit(request.body, 'password');
        // logger.debug("==>request: %j", requestData);
    } else {
        logger.debug("==>request:", JSON.stringify(requestData, null, 2));
    }

    next();
}



module.exports = requestLogger;
