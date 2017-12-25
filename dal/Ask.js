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
            , p.short_name AS short_name
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

    async getList (opts) {
        let self = this, context = self.context;
        let page = opts.page || 1;
        let limit = 30;
        let category = opts.category;
        let offset = 30 * (page -1);

        let args = {
            limit: limit,
            offset: offset,
            category: category
        };
        let sql = `
            SELECT
            a.id, a.title, a.reply_count, date_format(a.created_at,'%Y-%c-%d') as created_at, c.name as category_name
            FROM asks a
            INNER JOIN products p ON p.id = a.product_id
            INNER JOIN categories c ON c.id = p.category_id
            ${category ? ' WHERE c.name = :category' : '' }
            ORDER BY id DESC
            LIMIT :limit
            OFFSET :offset
        `;
        let sqlCount = `
            SELECT
            count(*) as amount
            FROM asks a
            INNER JOIN products p ON p.id = a.product_id
            INNER JOIN categories c ON c.id = p.category_id
            ${category ? ' WHERE c.name = :category' : '' }
        `;

        let [rows, row] = await Promise.all([
            self.querySelect({
                sql: sql,
                args: args
            }),
            self.queryOne({
                sql: sqlCount,
                args: args
            })
        ]);

        let amount = row.amount;

        return {
            amount: amount,
            rows: rows
        };
    }
}

module.exports = Ask;
