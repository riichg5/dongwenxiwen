/**
 * Organo Mobile Web Service, a.k.a Pulse
 */

require('./lib/init/init');
global.SERVER_SHUT_DOWN = false;
let CONFIG_LOCATION = './config.json';
let MIDDLEWARE_LOCATION = './middleware';
let HANDLERS_LOCATION = './handlers';
let MODELS_LOCATION = './models';
let DEFAULT_PORT = 8080;
let multipart = require('connect-multiparty');
let url = require('url');
let util = require('util');

let fs = require('fs');
let path = require('path');
let http = require('http');
var partials = require('express-partials');

let express = require('express');
let expressValidator = require('express-validator');
let bunyan = require('bunyan');
let getRawBody = require('raw-body');
let typer = require('media-typer');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let DAL = require('./dal');
let middleware, handlers, app;

try {
    console.info('Starting server worker process.');

    middleware = require(MIDDLEWARE_LOCATION);
    handlers = require(HANDLERS_LOCATION);

    app = express();
    app.enable('trust proxy');
    app.set('json spaces', 2);
    app.set('views', path.join(__dirname, 'views'));
    app.set("view engine", "ejs");
    app.use(partials());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(cookieParser());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(multipart());
    app.use(expressValidator());
    app.use(middleware.session());
    app.use(middleware.contextCreator());

    app.use(middleware.interceptor);
    app.use(middleware.logger(_logger));
    app.use(middleware.requestTracker);
    app.use(middleware.timeoutChanger);
    app.use(middleware.redisConnector);
    app.use(middleware.sequelizer(path.join(__dirname, MODELS_LOCATION), _config, _logger));

    // app.get('/admin/index', function (req, res) {
    //     res.sendFile(path.join(__dirname + '/public/views/admin/admin.html'));
    // });

    app.use(middleware.requestLogger);
    require(_base + 'routers/')(app, middleware, handlers);
    app.use(middleware.responder);

    let appServer = app.listen(_config.get('port') || DEFAULT_PORT, function() {
        console.info('Express 4.0 server listening on port ' + appServer.address().port);
    });
} catch (error) {
    console.error('Failed to start the server: %s', error.stack);
}

process.once('SIGUSR2', function (sig) {
    console.log("start to close http server.");
    global.SERVER_SHUT_DOWN = true;
    setTimeout(x => {
        // 15000ms later the process kill it self to allow a restart
        console.log("worker closed.");
        process.exit(0);
    }, 15000);
    console.log("receive system shutdown");
});

module.exports = app;