const path = require('path');

function registRouter (app, router, middleware, handlers) {
    router.get(
        '/',
        // middleware.ctrlLoad('handlers.v1.portal.login'),
        (req, res, next) => {
            res.status(200).render("index", {});
        }
    );

    router.get(
        '/questions/*.html',
        handlers.page.execute
        // (req, res, next) => {
        //     res.status(200).render("questions/html", {});
        // }
    );
}

module.exports = registRouter;