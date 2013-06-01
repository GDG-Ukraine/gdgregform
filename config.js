var config;
try {
  config = require('./config.json');
} catch(e) {}
if (!config) {
  var env = process.env.CONFIG;
  if (!env) throw "No configuration found!";
  console.log("config=",env);
  config = JSON.parse(env);
}
module.exports = config;
