var u = require('underscore');
var utils = require('../lib/utils');

function deepFreeze (o) {
  	var prop, propKey;
  	Object.freeze(o); // 首先冻结第一层对象.
  	for (propKey in o) {
    	prop = o[propKey];
    	if(!o.hasOwnProperty(propKey) || !(typeof prop === "object") || Object.isFrozen(prop)) {
      		// 跳过原型链上的属性和已冻结的对象.
      		continue;
    	}

    	deepFreeze(prop); //递归调用.
  	}
}

var c = utils.merge([
    require('./common'),
    require('./sequelize'),
]);

deepFreeze(c);

global.CONST = c;



const dad = 1;

const  a  = {
  a: 1
};

