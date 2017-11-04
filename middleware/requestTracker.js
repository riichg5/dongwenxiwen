// Return the middleware
let xRequestId = 'x-request-id';
function requestTracker(request, response, next) {
    let context = request.context;
    let logger = context.logger;
    let requestId = request.get(xRequestId) || request.get('x-client-request-id') || _utils.uuid();


    context.logger = logger.child({
            'request-id': requestId
        }, true);

    context.requestId = requestId;

    next();
}



module.exports = requestTracker;
