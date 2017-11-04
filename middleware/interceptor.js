var utils = require('../lib/utils');

function interceptor(request, response, next) {	
    if(SERVER_SHUT_DOWN === true) {
    	response.json({res: "ok"});
        // next(utils.createError("server maintenance.", 400));
        return;
    }

    next();
}

module.exports = interceptor;
