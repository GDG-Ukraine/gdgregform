var Sequelize = require('sequelize');

module.exports = require('../db.js').sequelize.define('gdg_events',{
	"url": Sequelize.STRING,
	"title":Sequelize.STRING,
	"desc":Sequelize.STRING,
	"date":Sequelize.DATE,
	"closereg":Sequelize.DATE,
	"fields":Sequelize.TEXT,
    "max_regs":Sequelize.INTEGER,
    "hidden":Sequelize.TEXT,
    "testing":Sequelize.BOOLEAN,
    "require_confirmation":Sequelize.BOOLEAN
});
