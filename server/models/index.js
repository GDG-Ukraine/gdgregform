require("fs").readdirSync("./server/models/").forEach(function(file) {
  if (file != 'index.js' && file[0] != '.') exports[file.substring(0,file.length-3)]=require("./" + file);
});

exports.participants.belongsToMany(exports.gevents, { as: 'Events', through: exports.participations, 'foreignKey': 'googler_id'});
exports.gevents.belongsToMany(exports.participants, { as: 'Participants', through: exports.participations, 'foreignKey': 'event_id' });

exports.gevents.belongsTo(exports.places,{'foreignKey': 'host_gdg_id', as:'Place'});

exports.invites.belongsTo(exports.gevents, {'foreignKey': 'event_id', as:'Event'});
exports.gevents.hasMany(exports.invites, { as: 'Invites', 'foreignKey': 'event_id' });

exports.participations.belongsTo(exports.gevents, {foreignKey:'event_id', as:"Event"});
exports.participations.belongsTo(exports.participants, {foreignKey:'googler_id', as:"Participant"});

