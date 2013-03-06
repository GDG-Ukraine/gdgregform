require("fs").readdirSync("./a").forEach(function(file) {
  if (file != 'index.js') exports[file.substring(0,file.length-3)]=require("./a/" + file);
});

exports.participants.hasMany(exports.gevents, { as: 'Events', joinTableName: 'gdg_events_participation', 'foreignKey': 'googler_id'});
exports.gevents.hasMany(exports.participants, { as: 'Participants', joinTableName: 'gdg_events_participation', 'foreignKey': 'event_id' });

