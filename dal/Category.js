const Base = require('./Base');
const redisHelper = require(_base + 'lib/redisHelper');


class Category extends Base {
    constructor(context) {
        super(context);
        this.model = context.models.Category;
    }

    async getCategories (opts) {
    	let self = this, context = self.context;
    	let key = `categories`;
    	let sql = `
    		SELECT id, name
    		FROM categories
    		LIMIT 20
    	`;
    	let args = {};
    	let categories = await self.querySelect({
    		sql: sql,
    		args: args,
    		cache: {
    			key: key,
    			ttl: 3600	//一个小时缓存
    		}
    	});

    	return categories;
    }
}

module.exports = Category;