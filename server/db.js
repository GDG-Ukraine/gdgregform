var Sequelize = require("sequelize");
var dbConfig = require("../config.js").db;

var sequelize = exports.sequelize = new Sequelize(dbConfig.db, dbConfig.user, dbConfig.password, {
    host: dbConfig.host,
    logging: false,
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
            attr != 'daoFactory' &&
            attr != 'daoFactoryName' &&
            attr != 'dataValues' &&
            attr != '__eagerlyLoadedAssociations' &&
            attr != '__eagerlyLoadedOptions' &&
            obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
};



