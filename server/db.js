var Sequelize = require("sequelize");
var dbConfig = require("../db.json");

var sequelize = exports.sequelize = new Sequelize(dbConfig.db, dbConfig.user, dbConfig.password, {
    host: dbConfig.host,
    define: {
        freezeTableName: true,
        syncOnAssociation: false,
        timestamps: false
    }
});

exports.copySqObject = function(obj) {
    var copy = new Object();
    for (var attr in obj) {
        if (
            attr != '__options' &&
            attr != 'selectedValues' &&
            attr != 'hasPrimaryKeys' &&
            attr != 'isNewRecord' &&
            obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
};



