let Base = require(_base + "handlers/Base");
let url = require('url');

class Handler extends Base {
    static getParams (request) {
        let context = request.context;
        let params = request.params;
        let id = params[0];

        if(!/\d/.test(id)) {
            _reject("迷路了", 404, {});
        }

        return _resolve({
            id: parseInt(id, 10)
        });
    }

    static validateParams (request) {
        var errors = request.validationErrors();

        if (errors) {
            return _reject("系统错误", 500, {});
        }

        return _resolve();
    }

    static async execute (request, response, next) {
        let self = this;
        let context = request.context;

        try {
            await self.validateParams(request);
            let params = await self.getParams(request);
            let bAsk = self.BLL.createAsk(context);
            let info = await bAsk.getAskPageInfo({id: params.id});

            if(!info) {
                _reject("迷路了", 404, {});
            }

            response.status(200).render('questions/html', info);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = {
    execute: Handler.execute.bind(Handler),
    class: Handler
}
