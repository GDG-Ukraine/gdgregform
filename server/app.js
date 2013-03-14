
var application_root = __dirname,
    express = require("express"),
    everyauth = require('everyauth'),
    auth = require('./auth'),
    path = require("path");

var app = exports.app = express();


process.on('uncaughtException', function (err) {
    console.error(err);
    if (err.stack) console.error(err.stack);

});

app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({secret: 'sfdsfsw234'}));
  app.use(express.compress());


  app.use(everyauth.middleware());

  app.use(auth.restrictAdmin);

  app.set('view engine', 'ejs');
  app.set('views', path.join(application_root, "/../public"));
  app.engine('html', require('ejs').renderFile);


  app.use(app.router);
  app.use(express.static(path.join(application_root, "/../public")));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

});

app.onError = function(res) {
  return function(err) { 
	console.log(err);
	res.send(err);
  }
}

auth.setup(app);
require('./registration')(app);
require('./card').setup(app);

require("fs").readdirSync("./server/api").forEach(function(file) {
  require("./api/" + file)(app);
});
