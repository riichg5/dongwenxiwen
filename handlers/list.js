let Base = require(_base + "handlers/Base");
let url = require('url');

class Handler extends Base {
    static getParams (request) {
        let context = request.context;
        let query = request.query;
        let page = parseInt(query.page, 10);

        return _resolve({
            category:  query.category,
            page: isNaN(page) || !page ? 1 : page
        });
    }

    static validateParams (request) {
        var errors = request.validationErrors();

        request.checkQuery('category', '参数错误').optional().len(1, 128);
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
            let listInfo = await bAsk.getListInfo({
                category: params.category,
                page: params.page
            });

            listInfo.category = {
                name: params.category
            };
            listInfo.pageInfo = [
            ];
            response.status(200).render('list', listInfo);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = {
    execute: Handler.execute.bind(Handler),
    class: Handler
}
