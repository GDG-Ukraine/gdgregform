var Sequelize = require('sequelize');

module.exports = require('../db.js').sequelize.define('gdg_places',{
    "city": Sequelize.STRING,
    "name": Sequelize.STRING,
    "url": Sequelize.STRING,
    "geo": Sequelize.STRING,
    "logo":Sequelize.STRING
});
