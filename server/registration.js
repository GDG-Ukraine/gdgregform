module.exports = function (app) {

    var application_root = __dirname;
    var path = require('path'),
        db = require('./db'),
        models = require('./models'),
        secret = require('./secret'),
        ejs = require('ejs'),
        fs = require('fs'),
        juice = require('juice')
        ;

// for static serving
    var s = require('express').static(path.join(application_root, "public"));

    app.get(/\/events\/(.*?)\/(.*)/, function (req, res, next) {
//express.static(path.join(application_root, "public")));
//  req.originalUrl = "/"+req.params[1];
        var eventId = req.params[0];
        req._parsedUrl.pathname = "/" + req.params[1];
        if (req.params[1] == 'contact_form.html')
            res.redirect("/events/" + eventId + "/register");
        else if (req.params[1] == 'register') {
            models.gevents.find(eventId).success(function (e) {
                if (!e) res.end("No such event");
                else {
                    e.getPlace().success(function (place) {
                        if (e.closereg && (new Date(e.closereg)) < (new Date())) {
                            models.gevents.findAll({order: 'date', limit: 5, where: ["date > NOW()", "closereg > NOW()"] }).success(function (events) {
                                res.render('regclosed.html', { event: e, events: events, place:place});
                            });
                        }
                        else res.render('contact_form.html', {event: e,place:place});
                    });
                }
            });
        } else s(req, res, next);
    });

};