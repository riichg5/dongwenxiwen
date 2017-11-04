let Base = require('./Base');

class Ask extends Base {
	constructor(context) {
		super(context);
		this.dal = this.DAL.createAsk(context);
	}

	async getAskPageInfo (opts) {
		let self = this, context = self.context;
		let id = opts.id;

		let ask = await self.dal.getAskInfo({id: id});
		if(!ask.content) {
			ask.content = [];
		}
		ask.bestAnswer = ask.content[0] || null;
		let pulled = _.pullAt(ask.content, [0]);

		return ask;
	}
}

module.exports = Ask;