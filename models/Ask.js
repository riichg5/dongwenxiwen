/**
 * asks table definition
 */

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('ask', {
        title: {
            type: DataTypes.STRING,
            field: 'title'
        },
        content: {
            type: DataTypes.STRING,
            field: 'content',
            get: function() {
                let val = this.getDataValue('content');
                if(!val) {
                    return [];
                }

                return JSON.parse(val);
            }
        },
        questionId: {
            type: DataTypes.INTEGER,
            field: 'question_id'
        },
        productId: {
            type: DataTypes.INTEGER,
            field: 'product_id'
        },
        replyCount: {
            type: DataTypes.INTEGER,
            field: 'reply_count'
        }
    }, {
        freezeTableName: true,
        tableName : 'asks'
    });

    // Model.removeAttribute('id');
};