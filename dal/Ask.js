const Base = require('./Base');
const moment = require('moment');

class Ask extends Base {
    constructor(context) {
        super(context);
        this.model = context.models.Ask;
    }

    async getAskInfo (opts) {
    	let self = this, context = self.context;
    	let id = opts.id;
    	let sql = `
    		SELECT
    		a.*
    		, p.name AS product_name
    		, p.id AS product_id
    		, p.img_path
    		FROM asks a
    		INNER JOIN products p ON a.product_id = p.id
    		WHERE a.id = :id
    	`;
    	let args = {
    		id: id
    	};

    	let info = await self.queryOne({
    		sql: sql,
    		args: args
    	});

    	if(!info) {
    		return null;
    	}

    	info.content = JSON.parse(info.content);
    	info.created_at = moment(info.created_at).format('YYYY-MM-DD HH:mm:ss');
    	return info;
    }
}

module.exports = Ask;
