var app = require('./server/app').app,
    spdy = require('./server/app.spdy').server;

spdy.listen(4243);
app.listen(4242);

console.log("Listening...");