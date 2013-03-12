var everyauth = require('everyauth');

var authMode = require('../config.json').auth;

everyauth.debug = false;

var usersById = {};

everyauth.everymodule
    .findUserById( function (id, callback) {
        callback(null, usersById[id]);
    });

var allowedUsers = [
    'olostan@gmail.com',
    'anastasiaafonina@gmail.com',
    'v.y.ivanov@gmail.com',
    'svyatoslav@sydorenko.org.ua',
    'oleh.zasadnyy@gmail.com'
];

exports.restrictAdmin = function(req, res, next) {
    if (authMode == "none") return next();
    if (req.path.substring(0,6)=='/admin') {
        //console.log(req.user);
        if (!req.user) {
           req.session.redirectTo = req.url;

           //   console.log(req);
           console.log("saving referer", req.session.redirectTo);
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

everyauth.everymodule.handleLogout( function (req, res) {
    req.logout(); // The logout method is added for you by everyauth, too
    this.redirect(res, req.header("Referer")||'/');
});


exports.check = function(req,res) {
    if (authMode == "none") return true;
    var allowed = req.user && allowedUsers.indexOf(req.user.email)>-1;
    if (!allowed) res.end("Not authorized");
    return allowed;
};

exports.setup = function(app) {
  if (authMode == 'none') return;
  app.get('/auth', function(req,res) {
    req.session.redirectTo = req.header('Referrer');
    res.redirect("/auth/google");
  });
};