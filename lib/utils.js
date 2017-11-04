var crypto = require('crypto');
var async = require('async');
var util = require('util');
var u = require('underscore');
var moment = require('moment');
let cls = require('continuation-local-storage');
let uuidGenerator = require('node-uuid');

// Constants
var DEFAULT_IMAGE_URL = '/images/nopic_mini.jpg';
var IMAGE_URL_PREFIX = '/upload/avatar/';

module.exports = {
    inTestMode: process.env.NODE_ENV === 'test',
    inDevMode: process.env.NODE_ENV === 'development',
    inProdMode: process.env.NODE_ENV === 'production',

    inspect: (opts) => {
        let obj = opts.obj;
        let depth = opts.depth || 5;

        return util.inspect(obj, {depth: depth});
    },

    //handler must be generator!
    coEach: (opts) => {
        let mapArr, start, totalLength;
        let results = [];
        let MAX_CONCURRENT = 2000;
        let collection = opts.collection;
        let handler = opts.func;
        let limit = opts.limit;

        if(!Array.isArray(collection)) {
            throw new Error('argument "collection" should be Array');
        }
        if(typeof handler !== 'function') {
            throw new Error('argument "func" should be function');
        }
        //not a number or negative
        if (!Number.isSafeInteger(limit) || limit < 0) {
            limit = 0;
        }
        //set max concurrent
        if(limit > MAX_CONCURRENT) {
            limit = MAX_CONCURRENT;
        }
        //set max concurrent if collection's length is very large and limit is not set
        totalLength = collection.length;
        if(totalLength && limit === 0) {
            limit = MAX_CONCURRENT;
        }

        return _co(function *() {
            let res;
            for(start=0; start<totalLength; ) {
                mapArr = collection.slice(start, start+limit);
                start += limit;

                res = yield mapArr.map(elem => {
                    return _co(handler(elem));
                });
                results = results.concat(res);
            }

            return results;
        });
    },

    uuid: () => {
        return _str.replaceAll(uuidGenerator.v4(), '-', '');
    },

    merge: (objects) => {
        var first = objects[0];
        if (!first) {
            return {};
        }
        var ref = objects.slice(1);
        var j = 0;
        var len = ref.length;
        for (; j < len; j++) {
            var object = ref[j];
            for (var k in object) {
                if (!{}.hasOwnProperty.call(object, k)) continue;
                var v = object[k];
                first[k] = v;
            }
        }
        return first;
    },

    createError: (message, statusCode, data) => {
        var error;
        error = new Error(message);
        error.statusCode = statusCode ? statusCode : 400;
        error.data = data || null;
        return error;
    },

    createErrorWithData: (options) => {
        var error;
        error = new Error(options.message || options.msg);
        error.statusCode = options.statusCode ? options.statusCode : 400;
        error.errorCode = options.errorCode ? options.errorCode : '';
        error.data = options.data ? options.data : null;
        return error;
    },

    getPlainArray: (rows) => {
        let temp = [];

        _.each(rows, item => {
            temp.push(item.get({plain: true}));
        });

        return temp;
    }
};
