const path = require('path');

function registRouter (app, router, middleware, handlers) {
    router.get(
        '/',
        handlers.list.execute
    );

    router.get(
        '/list',
        handlers.list.execute
    );

    router.get(
        '/questions/*.html',
        handlers.page.execute
    );
}

module.exports = registRouter;