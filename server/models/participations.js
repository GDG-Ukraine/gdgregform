var Sequelize = require('sequelize');

module.exports = require('../db.js').sequelize.define('gdg_events_participation',{
	"googler_id": Sequelize.INTEGER,
	"event_id":Sequelize.INTEGER,
	"fields":Sequelize.TEXT,
    "register_date": { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    "accepted": Sequelize.BOOLEAN,
    "visited": Sequelize.BOOLEAN,
    "deleted": Sequelize.BOOLEAN
});
