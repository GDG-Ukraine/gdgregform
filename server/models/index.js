require("fs").readdirSync("./server/models/").forEach(function(file) {
  if (file != 'index.js' && file[0] != '.') exports[file.substring(0,file.length-3)]=require("./" + file);
});

exports.participants.hasMany(exports.gevents, { as: 'Events', joinTableName: 'gdg_events_participation', 'foreignKey': 'googler_id'});
exports.gevents.hasMany(exports.participants, { as: 'Participants', joinTableName: 'gdg_events_participation', 'foreignKey': 'event_id' });

