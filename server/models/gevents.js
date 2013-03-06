exports.GEvents = require('../db.js').sequelize.define('gdg_events',{
	"url": Sequelize.STRING,
	"title":Sequelize.STRING,
	"desc":Sequelize.STRING
});
