let Base = require('./Base');
let request = require('request-promise');

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

	async getAskPageInfoFromJD (opts) {
		let self = this, context = self.context;
		let id = opts.id;

		let ask = await self.dal.getAskInfo({id: id});
		let [content, otherQuestions] = await Promise.all([
			self.getAnswersFromJD({
				questionId: ask.question_id
			}),
			self.getProductOtherQuestions({
				productId: ask.product_id,
				questionId: ask.question_id
			})
		]);

		ask.content = content;
		ask.otherQuestions = otherQuestions;
		// ask.skuInfo = info.skuInfo;

		if(!ask.content) {
			ask.content = [];
		}

		ask.bestAnswer = ask.content[0] || null;
		let pulled = _.pullAt(ask.content, [0]);

		return ask;
	}

	getFormatAnswerRows (opts) {
		let self = this, context = self.context;
		let rows = opts.answers;

		let content = rows.map(row => {
			return {
				id: row.id,
				likeCount: row.likeCount,
				content: row.content,
				nickName: row.userInfo ? row.userInfo.nickName : "",
				imgUrl: row.userInfo ? row.userInfo.imgUrl : "",
				created: row.created
			};
		});

		return _.compact(content);
	}

	async getAnswersFromJD (opts) {
		let self = this, context = self.context;
		let questionId = opts.questionId;
		let content = [];
		let page = 1;

		let res = await request({
			uri: `https://question.jd.com/question/getAnswerListById.action?page=${page}&questionId=${questionId}`,
		    headers: {},
		    json: true
		});

		content = self.getFormatAnswerRows({
			answers: res.answers
		});

		while(res.moreCount > 0) {
			page += 1;
			res = await request({
				uri: `https://question.jd.com/question/getAnswerListById.action?page=${page}&questionId=${questionId}`,
			    headers: {},
			    json: true
			});

			let rows = self.getFormatAnswerRows({
				answers: res.answers
			});
			content = content.concat(rows);

			// self.logger.debug(`content: ${_utils.inspect({obj: content})}`);
		}

		return content;
	}

	getPageUrl (opts) {
		let page = opts.page;
		let keyWord = opts.keyWord;
		let category = opts.category;
		let url, params = [];

		url = `${HOME_URL}/list`;

		if(category) {
			params.push(`category=${category}`);
		}
		if(keyWord) {
			params.push(`keyWord=${keyWord}`);
		}
		if(page) {
			params.push(`page=${page}`);
		}

		params = params.join('&');
		if(params) {
			return `${url}?${params}`;
		}

		return url;
	}

	getPageNumberInfos (opts) {
		let self = this;
		let currentPage = opts.currentPage;
		let maxPage = opts.maxPage;
		let btnAmount = opts.btnAmount;//要显示多少个页码按钮

		let	prevAmount = Math.floor(btnAmount/2);//向前显示多少
		let lastAmount = btnAmount - prevAmount;//向后显示多少
		let resPageNumbers = [];

		if(currentPage >= maxPage) {
			currentPage = maxPage;
		}
		if(currentPage < 1) {
			currentPage = 1;
		}

		let startPrev = currentPage;
		while(startPrev > 0 && prevAmount > 0) {
			resPageNumbers.push(startPrev);
			prevAmount -= 1;
			startPrev -= 1;
		}
		_.reverse(resPageNumbers);

		lastAmount = lastAmount; //前面剩下的，放到后面来
		let startLastPage = currentPage + 1;

		while(startLastPage <= maxPage && lastAmount >= 1) {
			resPageNumbers.push(startLastPage);
			lastAmount -= 1;
			startLastPage += 1;
		}

		return {
			currentPage: currentPage,
			pages: resPageNumbers
		};
	}

	getPagerInfo (opts) {
		let self = this, context = self.context;
		let amount = opts.amount;
		let currentPage = opts.currentPage;
		let keyWord = opts.keyWord;
		let category = opts.category;

		let pageSize = 30;
		let html = [];
		let maxPage = Math.ceil(amount / 30);

		let pageNumberInfos = self.getPageNumberInfos({
			currentPage: currentPage,
			maxPage: maxPage,
			btnAmount: 9
		});
		let pages = pageNumberInfos.pages;
		currentPage = pageNumberInfos.currentPage;

		if(currentPage > 1) {
			let prevUrl = self.getPageUrl({
				page: currentPage - 1,
				keyWord: keyWord,
				category: category
			});
			html.push(`<a href="${prevUrl}" class="pTag prev" pagerindex="${currentPage - 1}">上一页</a>`);
		}

		if(pages[0] > 1) {
			let firstUrl = self.getPageUrl({
				page: 1,
				keyWord: keyWord,
				category: category
			});
			html.push(`<a href="${firstUrl}" class="pTag" pagerindex="1">1</a>`);
			html.push(`<span class="ellipsis">...</span>`);
		}

		let biggerPage;
		for(let page of pages) {
			let url = self.getPageUrl({
				page: page,
				keyWord: keyWord,
				category: category
			});

			if(currentPage === page) {
				html.push(`<a href="${url}" class="pTag cur">${page}</a>`);
			} else {
				html.push(`<a href="${url}" class="pTag" pagerindex="${page}">${page}</a>`);
			}

			biggerPage = page;
		}

		if(biggerPage < maxPage) {
			let lastUrl = self.getPageUrl({
				page: maxPage,
				keyWord: keyWord,
				category: category
			});
			html.push(`<span class="ellipsis">...</span>`);
			html.push(`<a href="${lastUrl}" class="pTag" pagerindex="${maxPage}">${maxPage}</a>`);
		}

		if(currentPage < maxPage) {
			let page = currentPage + 1;
			let url = self.getPageUrl({
				page: page,
				keyWord: keyWord,
				category: category
			});
			html.push(`<a href="${url}" class="pTag next" pagerindex="${page}">下一页</a>`);
		}

		return html.join('');
	}

	async getProductOtherQuestions (opts) {
		let self = this, context = self.context;
		let productId = opts.productId;
		let questionId = opts.questionId;

		let others = await self.dal.findAll({
			attributes: ['replyCount', 'title', 'questionId', 'productId', 'id'],
			where: {
				productId: productId,
				questionId: {
					lt: questionId
				}
			},
			order: [['id', 'DESC']],
			limit: 5,
			raw: true
		});

		for(let item of others) {
			if(item.title && item.title.length > 40) {
				item.subTitle = `${item.title.substring(0, 40)}...`;
			} else {
				item.subTitle = item.title;
			}
		}

		return others;
	}

	async getListInfo (opts) {
		let self = this, context = self.context;
		let page = opts.page || 1;
		let category = opts.category;
		let keyWord = opts.keyWord;
		let dCategory = self.DAL.createCategory(context);

		let [pageInfo, categories] = await Promise.all([
			self.dal.getList({
				page: page,
				category: category
			}),
			dCategory.getCategories({})
		]);
		let pagerHtml = self.getPagerInfo({
			amount: pageInfo.amount,
			currentPage: page,
			keyWord: keyWord,
			category: category
		});

		return {
			amount: pageInfo.amount,
			rows: pageInfo.rows,
			categories: categories,
			pagerHtml: pagerHtml
		};
	}
}

module.exports = Ask;