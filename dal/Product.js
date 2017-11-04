var Base = require('./Base');

class Product extends Base {
    constructor(context) {
        super(context);
        this.model = context.models.Product;
    }

}

module.exports = Product;
