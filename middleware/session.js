let session = require('express-session');
let MySQLStore = require('express-mysql-session')(session);


let dbConfig = _config.get("databases.default");
let options = {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.name,
    checkExpirationInterval: 900000,
    expiration: 3600000,
    createDatabaseTable: true,
    connectionLimit: 1,
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
};

let sessionStore = new MySQLStore(options);

function sessionInit() {

	return function (req, res, next) {
		let path = req.path;

		_logger.debug("req.path:", path);
		// if(path.indexOf('/v1/admin') === 0) {
			// _logger.debug("it is an admin request.")
		    session({
		        key: 'sc',
		        secret: 'mdaurywiueyr327&^JJGdauhda%',
		        store: sessionStore,
		        resave: true,
		        saveUninitialized: true,
		        cookie: { maxAge: 3600000 }
		    })(req, res, next);
		// }
		// else {
		// 	_logger.debug("it is a common request.")
		// 	next();
		// }
	};

}

module.exports = sessionInit;
