var BLL = require('../bll');

class Base {
	static get BLL () {
		return BLL;
	}
}

module.exports = Base;