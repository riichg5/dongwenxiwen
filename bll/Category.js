let Base = require('./Base');

class Category extends Base {
	constructor(context) {
		super(context);
		this.dal = this.DAL.createCategory(context);
	}

}

module.exports = Category;