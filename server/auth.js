var everyauth = require('everyauth');

var authMode = require('../config.json').auth;

everyauth.debug = false;

var usersById = {};

everyauth.everymodule
    .findUserById( function (id, callback) {
        callback(null, usersById[id]);
    });

var nextCheck,admins;
var getAllowedUers = function(cb) {
  if (!nextCheck || nextCheck < Date.now()) {
     require('./models').admins.findAll().success(function (newAdmins) {
         admins = newAdmins;
         nextCheck = new Date();
         nextCheck.setHours(nextCheck.getHours()+1);
         //console.log('admins',admins);
         cb(admins);
     });
  }
  else cb(admins);
};

exports.restrictAdmin = function(req, res, next) {
    if (authMode == "none") return next();
    if (req.path.substring(0,6)=='/admin') {
        if (!req.user) {
           req.session.redirectTo = req.url;
           req.session.adminRequest = true;
           console.log("saving referer", req.session.redirectTo);
           res.redirect('/auth/google');
        } else {
            getAllowedUers(function(allowedUsers) {
                var user = allowedUsers.filter(function(u) { return u.email==req.user.email});
                if (user.length==0)
                    res.send(403,"Your account is not authorized to manage GDG data");
                 else {
                    req.user.admin = true;
                    req.user.filter_place = user[0].filter_place;
                    next();
                }
            });
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
    //.scope('https://www.googleapis.com/auth/userinfo#email https://www.googleapis.com/auth/userinfo.profile')
    .scope(function(req,res) {
        var scope = "https://www.googleapis.com/auth/userinfo#email https://www.googleapis.com/auth/userinfo.profile";
        if (req.session.adminRequest)
            scope = scope + " https://mail.google.com/ https://www.googleapis.com/auth/drive.file";
        return scope;
    })
    .findOrCreateUser( function (sess, accessToken, extra, googleUser) {
        googleUser.refreshToken = extra.refresh_token;
        googleUser.expiresIn = extra.expires_in;
        googleUser.accessToken = accessToken;
        return usersById[googleUser.id] || (usersById[googleUser.id] =  googleUser);
    })
    .redirectPath(function(req,res) {
        if (req.session.redirectTo) return req.session.redirectTo;
        console.log("Can't find redirection path");
        return "/admin/admin.html";
    });

everyauth.everymodule.handleLogout( function (req, res) {
    req.logout(); // The logout method is added for you by everyauth, too
    this.redirect(res, req.header("Referer")||'/');
});


exports.check = function(req,res) {
    if (authMode == "none") return true;
    var allowed = req.user && req.user.admin;
    if (!allowed) res.send(403,"Not authorized");
    return allowed;
};

exports.setup = function(app) {
  if (authMode == 'none') return;
  app.get('/auth', function(req,res) {
    req.session.redirectTo = req.header('Referrer');
    res.redirect("/auth/google");
  });
};