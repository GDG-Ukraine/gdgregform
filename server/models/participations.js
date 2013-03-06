var Sequelize = require('sequelize');

module.exports = require('../db.js').sequelize.define('gdg_events_participation',{
	"googler_id": Sequelize.INTEGER,
	"event_id":Sequelize.INTEGER
});
