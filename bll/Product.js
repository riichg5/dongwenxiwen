let Base = require('./Base');

class Product extends Base {
	constructor(context) {
		super(context);
		this.dal = this.DAL.createAsk(context);
	}
}

module.exports = Product;