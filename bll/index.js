var fs = require('fs');
var path = require('path');
var assert = require('assert');
var DirectoryNames = [];

function createBll(name, context) {
    // if(!context){
    //     context = _getContext();
    // }
    var appName = context.appName;
    assert(name && name.length > 0, 'name must be a non-empty string.');
    assert(typeof context === 'object', 'context must be a valid object.');

    appName = appName.toLowerCase();
    if (context.bll && context.bll[name]) {
        return context.bll[name];
    }

    if (exports[name]) {
        var bll = null;
        var companyCodePath = path.join(__dirname,`${appName}/${name}.js`);
        if(appName && fs.existsSync(companyCodePath)) {
            delete exports[name];
            exports.__defineGetter__(name, function () {
                return require(companyCodePath);
            });
            bll = new exports[name](context);
        } else {
            bll = new exports[name](context);
        }

        if (!context.bll) {
            context.bll = {};
        }
        context.bll[name] = bll;
        return bll;
    }
    else {
        console.log(`Cannot find bll: ${name}`);
    }

    console.dir(exports);
    throw new Error('Cannot find given BLL class name: ' + name);
}

function loadDirectory(exports, directory) {
    fs.readdirSync(directory).forEach(function (filename) {
        var fullPath;
        var stat;
        var match;

        // Skip itself
        if (filename === 'index.js' || /^\./.test(filename)) {
            return;
        }

        fullPath = path.join(directory, filename);
        stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            DirectoryNames.push(filename);
            return;
        } else {
            match = /(\w+)\.js$/.exec(filename);

            if (match) {
                exports.__defineGetter__(match[1], function () {

                    let tmp = null;
                    try{
                        tmp = require(fullPath);
                    }catch(err){
                        console.error(err);
                    }
                    return tmp;

                });

                //auto export createDao method
                exports['create' + match[1]] = function (context) {
                    return createBll(match[1], context);
                };
            }
        }
    });

    return exports;
}

loadDirectory(exports, __dirname);
exports.createBll = createBll;


