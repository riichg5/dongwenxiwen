var fs = require('fs');
var path = require('path');
var Sequelize = require('sequelize');
var u = require('underscore');
var cls = require('continuation-local-storage');
var namespace = cls.createNamespace('my-very-own-namespace');
var Promise = require('bluebird');
var clsBluebird = require('cls-bluebird');
clsBluebird(namespace);
// var types = require('pg').types;

/**
 * Cache of global instances of Sequelize and their models
 */
 global._DB_ORM_Cache = {};
// var cache = {};


/**
 * Add the global instance of Sequelize to the context, also exposed all
 * loaded models to context.models
 *
 * @method sequelize
 */
function sequelize(request, response, next) {
    var context = request.context;

    Object.keys(_DB_ORM_Cache).forEach(function(type) {
        if (type === 'default') {
            context.sequelize = _DB_ORM_Cache[type].instance;
            context.models = _DB_ORM_Cache[type].models;
        } else {
            context[type + 'Sequelize'] = _DB_ORM_Cache[type].instance;
            context[type + 'Models'] = _DB_ORM_Cache[type].models;
        }
    });

    // Temp patch for read replication problem. FIXME later.
    context.readSequelize = context.sequelize;
    context.readModels = context.models;

    next(null);
}

// function convertType() {
//     let integerParser = function(val) {
//         return parseInt(val, 10);
//     };

//     types.setTypeParser(20, integerParser); // int8 /bigint 测试我们的应用场景 int够用
//     types.setTypeParser(1021, parseFloat); // _float4
//     types.setTypeParser(1700, parseFloat); // decimal
// }

/**
 * Create  global Sequelize instances and import all predefined models.
 *
 * @method sequelizer
 * @param modelsDirectory {String} Canonical path to modules directory
 * @param config {Object} server configuration object.
 * @return {Function} an express middleware function
 */
function sequelizer(modelsDirectory, config) {
    let model = modelsDirectory;

    if (Object.keys(_DB_ORM_Cache).length === 0) {
        Object.keys(_config.get('databases')).forEach(function(type) {
            var dbConfig = _config.get('databases.' + type);
            var options;
            var associationsDirectory;

            console.info(`databases.${type}: %j`, dbConfig);
            options = u.clone(dbConfig.sequelize);
            options.protocol = dbConfig.protocol;
            options.host = dbConfig.host;
            options.port = dbConfig.port;
            options.isolationLevel = CONST.SEQUELIZE.READ_COMMITTED;

            console.info('Creating Sequelize instance: %s with options: %j.', type, options);
            _DB_ORM_Cache[type] = _DB_ORM_Cache[type] || {};

            _DB_ORM_Cache[type].instance = new Sequelize(
                dbConfig.name,
                dbConfig.username,
                dbConfig.password,
                options
            );

            console.info(
                'Loading all Sequelize models from: %s.',
                modelsDirectory
            );

            _DB_ORM_Cache[type].models = [];
            fs.readdirSync(model).forEach(function(filename) {
                /*jslint regexp: true */
                var match = /(\w+)\.js$/.exec(filename);

                if (match) {
                    if (!_utils.inTestMode) {
                        console.info('Importing model: %s from: %s.', match[1], filename);
                    }

                    _DB_ORM_Cache[type].models[match[1]] = _DB_ORM_Cache[type].instance['import'](
                        path.join(model, filename)
                    );
                }
            });

            associationsDirectory = path.join(model, 'associations');
            if (fs.existsSync(associationsDirectory)) {
                fs.readdirSync(associationsDirectory).forEach(function(filename) {
                    /*jslint regexp: true */
                    var match = /(\w+)\.js$/.exec(filename);
                    var func;

                    if (match) {
                        if (!_utils.inTestMode) {
                            console.info('Importing association: %s from: %s.', match[1], filename);
                        }
                        func = require(path.join(associationsDirectory, filename));
                        func(_DB_ORM_Cache[type].instance, _DB_ORM_Cache[type].models);
                    }
                });
            }
        });
    }

    // convertType();
    return sequelize;
}

module.exports = sequelizer;
