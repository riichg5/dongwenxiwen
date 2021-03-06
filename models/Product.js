/**
 * products table definition
 */

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('product', {
        name: {
            type: DataTypes.STRING,
            field: 'name'
        },
        shortName: {
            type: DataTypes.STRING,
            field: 'short_name'
        }
    }, {
        freezeTableName: true,
        tableName : 'products'
    });

    // Model.removeAttribute('id');
};