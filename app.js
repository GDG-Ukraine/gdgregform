var application_root = __dirname,
    express = require("express"),
    path = require("path"),
    spdy = require('spdy'),
    fs = require('fs'),
    everyauth = require('everyauth'),
    Sequelize = require("sequelize");


 var app = express();

var dbConfig = require("./db.json");
// Database

var sequelize = new Sequelize(dbConfig.db, dbConfig.user, dbConfig.password, {
    host: dbConfig.host,
    define: {
        freezeTableName: true,
        syncOnAssociation: false,
        timestamps: false
    }
})

// Config
everyauth.debug = false;

var usersById = {};
everyauth.everymodule
    .findUserById( function (id, callback) {
        callback(null, usersById[id]);
    });
var usersByGoogleId = {};

var allowedUsers = [
    'olostan@gmail.com',
    'anastasiaafonina@gmail.com',
    'v.y.ivanov@gmail.com',
    'svyatoslav@sydorenko.org.ua',
    'oleh.zasadnyy@gmail.com'
];


var checkAuthMiddleware = function(req, res, next) {
    if (req.path.substring(0,6)=='/admin') {
        //console.log(req.user);
        if (!req.user) {
           req.session.redirectTo = req.url;

           //   console.log(req);
           console.log("saiving referer", req.session.redirectTo);
           res.redirect('/auth/google');
        } else {
            if (allowedUsers.indexOf(req.user.email)==-1)
                res.end("Your account is not authorized to manage GDG data");
            else next();
        }
    } else {
        if (req.user) res.locals.user = req.user;
        next();
    }
};
/*var checkAuthMiddleware = function(req, res, next) {
        if (!req.user) {
            req.session.redirectTo = req.url;
            res.redirect('/auth/google');
        } else  {
            console.log(req.user);
            res.locals.user = req.user;
            next();
        }
};*/

everyauth.google
    .appId("655913597185.apps.googleusercontent.com")
    .appSecret("Qp_OB2nlEhKzaaFeQnwRVMS7")
    //.scope('https://www.googleapis.com/auth/userinfo.profile')
    .scope('https://www.googleapis.com/auth/userinfo#email https://www.googleapis.com/auth/userinfo.profile')
    .findOrCreateUser( function (sess, accessToken, extra, googleUser) {
        googleUser.refreshToken = extra.refresh_token;
        googleUser.expiresIn = extra.expires_in;
        return usersById[googleUser.id] || (usersById[googleUser.id] =  googleUser);
    })
    .redirectPath(function(req,res) {
        if (req.session.redirectTo) return req.session.redirectTo;
        //console.log(req.session.backUrl);
        console.log("Can't find redirection path");
        return "/admin/admin.html";
    });

//everyauth.google.redirectPath("/admin/admin.html");
everyauth.everymodule.handleLogout( function (req, res) {

    req.logout(); // The logout method is added for you by everyauth, too

    this.redirect(res, req.header("Referer")||'/');
});

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

var Participants = sequelize.define('gdg_participants',{
//	id: Sequelize.INTEGER,
"name": Sequelize.STRING,
"surname":Sequelize.STRING,
"nickname":Sequelize.STRING,
"email":Sequelize.STRING,
"phone":Sequelize.STRING,
"gplus":Sequelize.STRING,
"hometown":Sequelize.STRING,
"company":Sequelize.STRING,
"position":Sequelize.STRING,
"www":Sequelize.STRING,
"experience_level":Sequelize.STRING,
"experience_desc":Sequelize.STRING,
"interests":Sequelize.STRING,
"events_visited":Sequelize.STRING,
"english_knowledge":Sequelize.STRING,
"t_shirt_size":Sequelize.STRING,
"gender": Sequelize.STRING,
"additional_info":Sequelize.STRING
});
var GEvents = sequelize.define('gdg_events',{
//	id: Sequelize.INTEGER,
"url": Sequelize.STRING,
"title":Sequelize.STRING,
"desc":Sequelize.STRING
});

var Participations = sequelize.define('gdg_events_participation',{
//	id: Sequelize.INTEGER,
"googler_id": Sequelize.INTEGER,
"event_id":Sequelize.INTEGER
});
/*
Participants.hasOne(Participations,{ as:'Participation', foreignKey:'googler_id'});
Participations.hasMany(GEvents, { as:'Events', foreignKey: 'id'});

GEvents.hasOne(Participations,{ as:'Participation', foreignKey:'event_id'});
Participations.hasMany(Participants, { as:'Participants', foreignKey: 'id'});
Participants.belongsTo(Participations);
*/
Participants.hasMany(GEvents, { as: 'Events', joinTableName: 'gdg_events_participation', 'foreignKey': 'googler_id'});
GEvents.hasMany(Participants, { as: 'Participants', joinTableName: 'gdg_events_participation', 'foreignKey': 'event_id' });

/*Participants.find(4293).success(function(p) {
   p.getEvents().success(function(events) {
         console.log(events);
   })
})
GEvents.find(1).success(function(p) {
    p.getParticipants().success(function(ps) {
        console.log(ps);
    })
})*/



var copySqObject = function(obj) {
    var copy = new Object();
    for (var attr in obj) {
        if (
            attr != '__options' &&
            attr != 'selectedValues' &&
            attr != 'hasPrimaryKeys' &&
            attr != 'isNewRecord' &&
            obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}


var onError = function(res) {
  return function(err) { 
	console.log(err);
	res.send(err);
  }
}

var allowedUser = function(req,res) {
    var allowed = req.user && allowedUsers.indexOf(req.user.email)>-1;
    if (!allowed) res.end("Not authorized");
    return allowed;
}

// list
app.get('/api/participants', function (req, res) {
   if (!allowedUser(req,res)) return;
   Participants.findAll().success(function(participants) {
     res.send(participants);
  })
});
// get
app.get('/api/participants/:id', function (req, res) {
    if (!allowedUser(req,res)) return;
    if (!req.params.id) return res.send("Invalid request");
    Participants.find(req.params.id).success(function (p) {
        p.getEvents().success(function(events) {
            var newP = copySqObject(p);
            newP.events = events;
            res.json(newP);
        });
    }).error(onError(res));
});

// create 
app.post('/api/participants', function (req, res){
  if (!req.body.user || !req.body.user.email) { return res.send("Incorrect request");};
  Participants.find({ where: { email: req.body.user.email }})
  .success(function(p) {
    var addToEvent = function(p) {
	   // add to event
	   Participations.find({ where: {googler_id:p.id,event_id:req.body.event}}).success(function(np) {
		if (np==null)  Participations.create({googler_id:p.id,event_id:req.body.event});
           });
        };
	var saved = function(p) {
		addToEvent(p);
		res.send(p);
	};
	if (p == null) Participants.create(req.body.user).success(saved);
  	  else p.updateAttributes(req.body.user).success(saved).error(onError(res));
  }).error(onError(res));
});
// update
app.put('/api/participants/:id', function (req, res){
  if (!allowedUser(req,res)) return;
  Participants.find(req.params.id).success(function (p) { 
	p.updateAttributes(req.body)
	  .success(function(p) { res.send(p);}).error(onError(res));
  }).error(function(err) { console.log(err);res.send(err); }); 
});
// delete
app.delete('/api/participants/:id', function (req, res){
  if (!allowedUser(req,res)) return;
  Participants.find(req.params.id).success(function (p) { 
	p.destroy()
	  .success(function(p) { res.send({ok: true});}).error(onError(res));
  }).error(function(err) { console.log(err);res.send(err); }); 
});

// list
app.get('/api/participants', function (req, res) {
   if (!allowedUser(req,res)) return;
   Participants.findAll().success(function(participants) {
     res.send(participants);
  })
});

/// EVENTS

// get
app.get('/api/events/:id', function (req, res) {
    if (!allowedUser(req,res)) return;
    if (!req.params.id) return res.send("Not found");
    GEvents.find(req.params.id).success(function (e) {
        e.getParticipants().success(function(ps) {
                var newE = copySqObject(e);
                newE.participants = ps;
                res.json(newE);

        });
    }).error(function(err) { console.log(err);res.send(err); });
});
// create 
app.post('/api/events', function (req, res){
  if (!allowedUser(req,res)) return;
  GEvents.create(req.body).success(function(p) { res.send(p);}).error(onError(res));
});
// update
app.put('/api/events/:id', function (req, res){
  if (!allowedUser(req,res)) return;
  GEvents.find(req.params.id).success(function (p) { 
	p.updateAttributes(req.body)
	  .success(function(p) { res.send(p);}).error(onError(res));
  }).error(function(err) { console.log(err);res.send(err); }); 
});
// delete
app.delete('/api/events/:id', function (req, res){
  if (!allowedUser(req,res)) return;
  GEvents.find(req.params.id).success(function (p) { 
	p.destroy()
	  .success(function(p) { res.send({ok: true});}).error(onError(res));
  }).error(function(err) { console.log(err);res.send(err); }); 
});
// list
app.get('/api/events', function (req, res) {
   if (!allowedUser(req,res)) return;
   GEvents.findAll().success(function(participants) {
     res.send(participants);
  })
});


app.get('/api/event-participants/:id', function(req, res) {
    if (!allowedUser(req,res)) return;
    Participations.findAll({where: {event_id: req.params.id}}).success(function(list) {
       res.send(list);
    });
});
app.get('/api/participant-events/:id', function(req, res) {
    if (!allowedUser(req,res)) return;
    Participations.findAll({where: {googler_id: req.params.id}}).success(function(list) {
        res.send(list);
    });
});

// Static wrapper

var s = express.static(path.join(application_root, "public"));
app.get(/\/events\/(.*?)\/(.*)/, function(req,res,next) {
//express.static(path.join(application_root, "public")));
//  req.originalUrl = "/"+req.params[1];
  var eventId = req.params[0];
  req._parsedUrl.pathname= "/"+req.params[1];
  if (req.params[1]=='contact_form.html')
    res.redirect("/events/"+eventId+"/register");
  else
  if (req.params[1] == 'register') {
     GEvents.find(eventId).success(function(e) {
        if (!e) res.end("No such event")
        else res.render('contact_form.html', {event: e});
     });
  } else
  s(req,res,next);

});

app.get('/auth', function(req,res) {
    req.session.redirectTo = req.header('Referrer');
    res.redirect("/auth/google");
})

// Launch server
var options = {
    key: fs.readFileSync(__dirname + '/keys/key.pem'),
    cert: fs.readFileSync(__dirname + '/keys/crt.pem'),
    ca: fs.readFileSync(__dirname + '/keys/csr.pem'),

    // SPDY-specific options
    windowSize: 1024 // Server's window size
 //   plain: 'spdy/2'
};
var server = spdy.createServer(options, app);

server.listen(4243);
console.log("Listening...");
app.listen(4242);