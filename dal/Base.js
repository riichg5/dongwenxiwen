let DAL = require('./index');
let redisHelper = require(_base + 'lib/redisHelper');

let enableAuditLog = _config.get('application.enableAuditLog');
let nonAuditTables = _config.get('application.nonAuditTables');

class BaseDal {
    constructor(context) {
        this.context = context;
        this.logger = context ? context.logger : {};
        this.sequelize = context.sequelize;
        this.model = null;
        this.DAL = DAL;
    }

    getCurrentTransaction(){
        let context = this.context;
        if(
            context.sequelize.namespace
            && context.sequelize.namespace.get('transaction')
        ){
            return  _resolve(context.sequelize.namespace.get('transaction'));
        }

        return _reject("不能获得事务");
    }

    /**************** use sequelize function **********************/
    query(...params) {
        let sql = params[0];
        let queryOpts = params[1];

        if(!enableAuditLog) {
            return this.sequelize.query.apply(this.sequelize, params).then(res => {
                return res;
            }).catch(error => {
                if (process.env.NODE_ENV !== 'production') {
                    error['developer-message'] = 'Failed to execute sql query(' + params[0] + ' with args: ' + _util.inspect(queryOpts.replacements, {depth: null})+ ')';
                }
                return _reject(error);
            });
        }

        let self = this;
        let dAuditLog = DAL.createAuditLog(this.context);
        let tableName = _utils.getTableName(sql);
        let newParams;
        let selectSql;

        if (!queryOpts) {
            queryOpts = {
                args: {},
                type: _utils.getSqlQueryType(sql)
            };
        }

        return _resolve().then(() => {
            switch (queryOpts.type) {
                case CONST.SEQUELIZE.QUERY_TYPE.UPDATE:
                    selectSql = _utils.convertSqlToSelect(sql, tableName);
                    sql = _utils.addReturningToSql(sql); //add returning to old sql
                    let oldResults;
                    let newResults;

                    //get old values
                    return this.sequelize.query.apply(this.sequelize, [selectSql, queryOpts]).then(res => {
                        oldResults = res;
                        //do update and return the new results
                        return this.sequelize.query.apply(this.sequelize, [sql, queryOpts]);
                    }).then(res => {
                        setTimeout(() => {
                            //如果table不记录,则跳过
                            if(nonAuditTables[tableName]) {
                                return;
                            }
                            newResults = res;
                            oldResults.forEach(oldRes => {
                                let newRes = _.find(newResults, {id: oldRes.id});
                                if (newRes) {
                                    let bulk = dAuditLog.getAuditBulk({
                                        actionType: DAL.AuditLog.ACTION_TYPES.UPDATE,
                                        tableName: tableName,
                                        previousModel: oldRes,
                                        newModel: newRes,
                                        changedFields: Object.keys(oldRes)
                                    });
                                    dAuditLog.bulkCreate(bulk, {returning: false});
                                }
                            });
                        }, 1);

                        return _resolve(newResults);
                    });

                case CONST.SEQUELIZE.QUERY_TYPE.INSERT:
                    sql = _utils.addReturningToSql(sql);
                    newParams = [sql, queryOpts];

                    return this.sequelize.query.apply(this.sequelize, newParams).then(results => {
                        // setTimeout(() => {
                        //     if(nonAuditTables[tableName]) {
                        //         return;
                        //     }
                        //
                        //     var bulks = [];
                        //     results.forEach(r => {
                        //         let bulk = dAuditLog.getAuditBulk({
                        //             actionType: DAL.AuditLog.ACTION_TYPES.CREATE,
                        //             tableName: tableName,
                        //             previousModel: {},
                        //             newModel: r,
                        //             changedFields: Object.keys(r)
                        //         });
                        //         bulks = bulks.concat(bulk);
                        //     });
                        //     dAuditLog.bulkCreate(bulks, {returning: false});
                        // }, 1);

                        return _resolve(results);
                    });

                case CONST.SEQUELIZE.QUERY_TYPE.DELETE:
                    let beforeDelResults;
                    selectSql = _utils.convertSqlToSelect(sql, tableName);

                    return this.sequelize.query.apply(this.sequelize, [selectSql, queryOpts]).then(results => {
                        beforeDelResults = results;
                        return this.sequelize.query.apply(this.sequelize, [sql, queryOpts]);
                    }).then(res => {
                        setTimeout(() => {
                            //如果table不记录,则跳过
                            if(nonAuditTables[tableName]) {
                                return;
                            }

                            beforeDelResults.forEach(r => {
                                let bulk = dAuditLog.getAuditBulk({
                                    actionType: DAL.AuditLog.ACTION_TYPES.DELETE,
                                    tableName: tableName,
                                    previousModel: r,
                                    newModel: {},
                                    changedFields: Object.keys(r)
                                });
                                dAuditLog.bulkCreate(bulk, {returning: false});
                            });
                        }, 1);

                        return _resolve(res);
                    });

                case CONST.SEQUELIZE.QUERY_TYPE.SELECT:
                default:
                    return  this.sequelize.query.apply(this.sequelize, params);
            }
        }).then(res => {
            return res;
        }).catch(error => {
            if (process.env.NODE_ENV !== 'production') {
                error['developer-message'] = 'Failed to execute sql query(' + sql + ' with args: ' + _util.inspect(queryOpts.replacements, {depth: null})+ ')';
            }
            return _reject(error);
        });
    }

    /**
    * update sql query
    * @return effect row count
    */
    queryUpdate(opts) {
        let sql = opts.sql;
        let args = opts.args || {};
        let queryOpts = {
            replacements: args,
            type: CONST.SEQUELIZE.QUERY_TYPE.UPDATE
        };
        return this.query(sql, queryOpts).then(res => {
            // this.logger.debug("queryUpdate res: %j", res);
            // return res[1].rowCount;
            return;
        });
    }

    queryInsert(opts) {
        let sql = opts.sql;
        let args = opts.args || {};
        let queryOpts = {
            replacements: args,
            type: CONST.SEQUELIZE.QUERY_TYPE.INSERT
        };
        return this.query(sql, queryOpts).then(res => {
            // return res[1].rowCount;
            // this.logger.debug("queryInsert res: %j", res);
            return;
        });
    }

    queryDelete(opts) {
        let sql = opts.sql;
        let args = opts.args || {};
        let queryOpts = {
            replacements: args,
            type: CONST.SEQUELIZE.QUERY_TYPE.DELETE
        };
        return this.query(sql, queryOpts).then(res => {
            // return res[1].rowCount;
            // this.logger.debug("queryDelete res: %j", res);
            return;
        });
    }

     /**
      * query multi result
      * @param  {object} opts:
      *         sql: required
	  * 		args:
      * 		cache: {
      * 	        key:
      * 	        ttl:
      	*   	}
      * @return []
      */
    querySelect(opts) {
        let sql = opts.sql;
        let args = opts.args || {};
        let cache = opts.cache; //TODO:
        let context = this.context;
        let queryOpts = {
            replacements: args,
            type: CONST.SEQUELIZE.QUERY_TYPE.SELECT
        };

        if(cache && cache.key && cache.ttl) {
            context.logger.debug('>>>>>>> get from redis: ', cache);
            return redisHelper.pGet(context, cache.key).then(res => {
                if(res) {
                    return _resolve(res);
                }

                return this.query(sql, queryOpts).then(res => {
                    //asynchronous set redis
                    if(res && res.length) {
                        redisHelper.pSet(context, cache.key, res, cache.ttl);
                    }
                    return _resolve(res);
                });
            });
        } else {
            return this.query(sql, queryOpts);
        }
    }

     /**
      * query single result
      * @param  {object} opts:
      *         sql: required
	  * 		args:
      * 		cache:
      * @return {}
      */
    queryOne(opts) {
        return this.querySelect(opts).then(res => {
            if (_.isEmpty(res)) {
                return _resolve(null);
            }
            return _resolve(res[0]);
        });
    }

    /**************** use model function **********************/

    queryOneById(...params) {
        return this.model.findById.apply(this.model, params).then(res => {
            if(!res) {
                return _resolve(null);
            }
            return _resolve(res);
        });
    }

    getById(...params) {
        return this.model.findById.apply(this.model, params);
    }

    getByIdsWithRaw(ids) {
        let self = this;
        let chunks = _.chunk(ids, 10);

        if(!ids || ids.length === 0) {
            return _resolve([]);
        }

        return _utils.coEach({
            collection: chunks,
            limit: 10,
            func: function* (ids) {
                return yield self.findAll({
                    where: {
                        id: {
                            $in: ids
                        }
                    },
                    raw: true
                });
            }
        });
    }

    findOne(...params) {
        return this.model.findOne.apply(this.model, params);
        // .catch(error => {
        //     if (process.env.NODE_ENV !== 'production') {
        //         error['developer-message'] = 'Failed to execute sql query(' + params[0] + ' with args: ' + _util.inspect(queryOpts.replacements, {depth: null})+ ')';
        //     }
        // });
    }

    create(...params) {
        return this.model.create.apply(this.model, params);
    }

    //直接调用model.bulkCreate,默认returning=false,这样会导致hook中写入audit_log record_id写不进去
    bulkCreate(...params) {
        if(params[1]) {
            if(!params[1].hasOwnProperty('returning')) {
                params[1].returning = true;
            }
        } else {
            params[1] = {returning: true};
        }
        return this.model.bulkCreate.apply(this.model, params);
    }

    update(options) {
        let context = this.context;
        var model = options.model;
        var where = options.where;
        let tableName = this.model ? this.model.getTableName() : '';
        // var returning = options.returning || false;

        return this.model.update(model, {where: where, returning: false, individualHooks: true, tableName: tableName, model: this.model});
    }

    updateWithReturn (options) {
        let context = this.context;
        var model = options.model;
        var where = options.where;
        let tableName = this.model ? this.model.getTableName() : '';

        return this.model.update(model, {where: where, returning: true, individualHooks: true, tableName: tableName, model: this.model});
    }

    destroy(...params) {
        if(params[0]) {
            params[0].individualHooks = true;
        }
        return this.model.destroy.apply(this.model, params);
    }

    //no hook to upsert
    /*
    upsert(...params) {
        return this.model.upsert.apply(this.model, params);
    }
    */

    findAndCountAll(...params) {
        return this.model.findAndCountAll.apply(this.model, params);
    }

    findAndCount (...params) {
        return this.model.findAndCount.apply(this.model, params);
    }

    findAll(...params) {
        return this.model.findAll.apply(this.model, params);
    }

    findOrCreate (...params) {
        return this.model.findOrCreate.apply(this.model, params);
    }

    count(...params) {
        return this.model.count.apply(this.model, params);
    }

    max(...params) {
        return this.model.max.apply(this.model, params);
    }

    min(...params) {
        return this.model.min.apply(this.model, params);
    }

    sum(...params) {
        return this.model.sum.apply(this.model, params);
    }

    upsert(...params) {
        return this.model.upsert.apply(this.model, params);
    }

}

module.exports = BaseDal;
