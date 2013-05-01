var Sequelize = require('sequelize');

module.exports = require('../db.js').sequelize.define('gdg_events',{
	"url": Sequelize.STRING,
	"title":Sequelize.STRING,
	"desc":Sequelize.STRING,
	"date":Sequelize.DATE,
	"closereg":Sequelize.DATE,
	"fields":Sequelize.TEXT,
    "logo":Sequelize.STRING
});
