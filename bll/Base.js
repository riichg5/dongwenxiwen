let DAL = require('../dal');
let BLL = require('./index');
let lockHelper = require(_base + 'lib/lockHelper');
let redisHelper = require(_base + 'lib/redisHelper');
let Promise = require('bluebird');

class Base {
	constructor(context) {
		this.context = context;
		this.logger = context ? context.logger : {};
		this.DAL = DAL;
		this.BLL = BLL;
	}

	noThrowError(promise) {
		let self = this, context = this.context;

		return _co(function* () {
			try {
				return yield promise;
			} catch (error) {
				self.logger.error(`error message: ${error.message}, error.stack: ${error.stack}`);
			}
		});
	}

	getById(id) {
		return this.dal.getById(id);
	}

	getByIds (ids) {
		return this.dal.findAll({where: {id: ids}});
	}

	queryOneById(id) {
		return this.dal.queryOneById(id);
	}

	beginTran (func) {
		return this.context.v3s.transaction(() => {
			return func();
		});
	}
	beginTranWithCo (func) {
		let self = this;
		return self.beginTran(()=> {
			return _co(func);
		});
	}

	combineContext (oldContext, context) {
	    oldContext.logger = context.logger;
	    oldContext.memcachedClient = context.memcachedClient;
	    oldContext.databaseClient = context.databaseClient;
	    oldContext.readDatabaseClient = context.readDatabaseClient;
	    oldContext.sequelize = context.sequelize;
	    oldContext.models = context.models;
	    oldContext.readSequelize = context.readSequelize;
	    oldContext.readModels = context.readModels;
	    oldContext.daos = context.daos;
	    oldContext.statsdClient = context.statsdClient;
	    oldContext.redisClient = context.redisClient;
	    oldContext.v3ms = context.v3ms;
	    oldContext.v3s = context.v3s;

	    //如果老的context没有，则用现在的context中的数据
	    if(!oldContext.order) {
	    	oldContext.order = Object.create(null);
	    	oldContext.order.trackInventoryVariants = context.order.trackInventoryVariants;
	    	oldContext.order.warehouse = context.order.warehouse;
	    }
	}

	mergeContext(context1, context2) {
		return _.merge(context1, context2);
	}

	getLockValue (value) {
		let self = this;
		let context = self.context;
		let requestId = context.requestInfo.requestId;
		let obj = Object.create(null);

		obj.requestId = requestId;
		obj.value = value;

		return JSON.stringify(obj);
	}

	getValueOfLock (lockValue) {
		if(!lockValue) {
			return undefined;
		}
		return lockValue.value;
	}

	getRequestIdOfLock (lockValue) {
		if(!lockValue) {
			return undefined;
		}
		return lockValue.requestId;
	}

	//管理请求级别的锁，需要在请求结束后解锁的keys
	addRequestLockKeys (opts) {
		let self = this;
		let context = self.context;
		let key = opts.key;

		if(!context.data.requestLockKeys) {
			context.data.requestLockKeys = [];
		}

		context.logger.debug(`add lock key to request lock keys: ${key}`);
		context.data.requestLockKeys.push(key);
	}

	removeRequestLockKey (opts) {
		let self = this, context = self.context;
		let key = opts.key;

		if(!context.data.requestLockKeys) {
			context.data.requestLockKeys = [];
		}

		context.logger.debug(`remove lock key to request lock keys: ${key}`);
		_.pull(context.data.requestLockKeys, key);
	}

	//请求结束后销毁占用的锁
	destroyRequestLockKeys (opts) {
		let self = this;
		let context = self.context;
		let pUnlock = Promise.promisify(lockHelper.unlock).bind(lockHelper);

		return _co(function* () {
			self.logger.debug('start destroy lock keys of request ...');

			if(!context.data.requestLockKeys) {
				return;
			}

			let pGet = Promise.promisify(redisHelper.get).bind(redisHelper);
			let requestId = context.requestInfo.requestId;
	        yield _utils.coEach({
	    		limit: 20,
	    		collection: context.data.requestLockKeys || [],
	    		func: function* (key) {
	                try {

	                	let lockValue = yield pGet(context, key);
	                	let requestIdOfLock = self.getRequestIdOfLock(lockValue);

	                	if(requestIdOfLock === requestId) {
		                    yield pUnlock({
		                        context: context,
		                        name: key
		                    });
		                    self.logger.debug(`destroyRequestLockKeys unlock key ${key} success.`);
	                	}
	                } catch(error) {
	                    self.logger.debug(`destroyRequestLockKeys unlock ${key} error`);
	                }
	    		}
	    	});
		});
	}
}

module.exports = Base;
