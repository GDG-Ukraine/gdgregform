var Sequelize = require('sequelize');

module.exports = require('../db.js').sequelize.define('gdg_invites',{
    "code": { type: Sequelize.STRING, primaryKey:true},
    "email":Sequelize.STRING,
    "event_id":Sequelize.INTEGER,
    "used":Sequelize.BOOLEAN
});
