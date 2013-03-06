
var application_root = __dirname,
    express = require("express"),
    everyauth = require('everyauth'),
    path = require("path");

var app = exports.app = express();

app.configure(function () {
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({secret: 'sfdsfsw234'}));
  app.use(express.compress());


  app.use(everyauth.middleware());

  app.use(checkAuthMiddleware);

  app.set('view engine', 'ejs');
  app.set('views', path.join(application_root, "public"));
  app.engine('html', require('ejs').renderFile);


  app.use(app.router);
  app.use(express.static(path.join(application_root, "public")));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

});

app.onError = function(res) {
  return function(err) { 
	console.log(err);
	res.send(err);
  }
}

require('./auth').setup(app);
require('./registration')(app);

require("fs").readdirSync("./api").forEach(function(file) {
  require("./a/" + file)(app);
});
