var Sequelize = require('sequelize');

module.exports = require('../db.js').sequelize.define('gdg_admins',{
    "id": Sequelize.INTEGER,
    "email": Sequelize.STRING,
    "filter_place": Sequelize.INTEGER,
    "googler_id": Sequelize.INTEGER,
    "godmode": Sequelize.BOOLEAN
});
