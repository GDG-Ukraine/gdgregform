module.exports = function(app) {

var application_root = __dirname;
var path = require('path'),
    models = require('./models');

// for static serving
var s = require('express').static(path.join(application_root, "public"));

app.get(/\/events\/(.*?)\/(.*)/, function(req,res,next) {
//express.static(path.join(application_root, "public")));
//  req.originalUrl = "/"+req.params[1];
  var eventId = req.params[0];
  req._parsedUrl.pathname= "/"+req.params[1];
  if (req.params[1]=='contact_form.html')
    res.redirect("/events/"+eventId+"/register");
  else
  if (req.params[1] == 'register') {
     models.gevents.find(eventId).success(function(e) {
        if (!e) res.end("No such event")
        else if (e.closereg && (new Date(e.closereg))<(new Date()))
            res.render('regclosed.html', { event: e});
        else res.render('contact_form.html', {event: e});
     });
  } else s(req,res,next);
});

}