var spdy = require('spdy'),
    app = require('./app').app;

// Launch server
var options = {
    key: fs.readFileSync(__dirname + '/keys/key.pem'),
    cert: fs.readFileSync(__dirname + '/keys/crt.pem'),
    ca: fs.readFileSync(__dirname + '/keys/csr.pem'),

    // SPDY-specific options
    windowSize: 1024 // Server's window size
 //   plain: 'spdy/2'
};

exports.server = spdy.createServer(options, app);
