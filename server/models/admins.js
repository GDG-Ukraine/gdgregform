var Sequelize = require('sequelize');

module.exports = require('../db.js').sequelize.define('gdg_admins',{
    "email": Sequelize.STRING,
    "filter_place": Sequelize.INTEGER
});