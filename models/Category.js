/**
 * products table definition
 */

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('category', {
        name: {
            type: DataTypes.STRING,
            field: 'name'
        }
    }, {
        freezeTableName: true,
        tableName : 'categories'
    });

    // Model.removeAttribute('id');
};