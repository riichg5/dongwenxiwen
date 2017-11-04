var path = require('path');
var fs = require('fs');
var cache = {};

function ctrlLoad(ctrlObjString) {
    return function (req, res, next) {
        var context = req.context;
        var companyCode = context.companyCode;
        var ctrlPath = "../" + ctrlObjString.replace(/\./gi, "/") + ".js";
        var execute;

        if(cache[ctrlObjString]) {
            return cache[ctrlObjString](req, res, next);
        }

        if(!companyCode) {
            console.log("use controller:", ctrlPath);
            execute = require(ctrlPath).execute;
            cache[ctrlObjString] = execute;
            return execute(req, res, next);
        }

        var name = ctrlPath.substring(ctrlPath.lastIndexOf('/') + 1);
        var dirPath = ctrlPath.substring(0, ctrlPath.lastIndexOf('/'));
        if(_.isString(companyCode)){
            companyCode = companyCode.toLowerCase();
        }
        // var companyHandlerFileName = companyCode + '.' + name;
        var companyHandlerPath = path.join(dirPath, 'override', companyCode, name);
        console.log("companyHandlerPath:", companyHandlerPath);
        if (fs.existsSync(path.join(__dirname, companyHandlerPath))) {
            console.log("use controller:", companyHandlerPath);
            execute = require(companyHandlerPath).execute;
            cache[ctrlObjString] = execute;
            return execute(req, res, next);
        }

        console.log("use controller:", ctrlPath);
        execute = require(ctrlPath).execute;
        cache[ctrlObjString] = execute;
        return execute(req, res, next);
    };
}

module.exports = ctrlLoad;
