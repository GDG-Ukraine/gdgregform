var models = require('../models');
var auth = require('../auth'),
    db = require('../db');

module.exports = function(app) {

// list
app.get('/api/participants', function (req, res) {
   if (!auth.check(req,res)) return;
   models.participants.findAll().success(function(participants) {
     res.send(participants);
  })
});

// get
app.get('/api/participants/:id', function (req, res) {
    if (!auth.check(req,res)) return;
    if (!req.params.id) return res.send("Invalid request");
    models.participants.find(req.params.id).success(function (p) {
        p.getEvents().success(function(events) {
            var newP = db.copySqObject(p);
            newP.events = events;
            res.json(newP);
        });
    }).error(app.onError(res));
});

// create 
app.post('/api/participants', function (req, res){
  if (!req.body.user || !req.body.user.email) { return res.send("Incorrect request");};
  models.participants.find({ where: { email: req.body.user.email }})
  .success(function(p) {
    var addToEvent = function(p) {
	   // add to event
	   models.participations.find({ where: {googler_id:p.id,event_id:req.body.event}}).success(function(np) {
		if (np==null)  models.participations.create({googler_id:p.id,event_id:req.body.event});
           });
        };
	var saved = function(p) {
		addToEvent(p);
		res.send(p);
	};
	if (p == null) models.participants.create(req.body.user).success(saved);
  	  else p.updateAttributes(req.body.user).success(saved).error(app.onError(res));
  }).error(app.onError(res));
});

// update
app.put('/api/participants/:id', function (req, res){
  if (!auth.check(req,res)) return;
  models.participants.find(req.params.id).success(function (p) { 
	p.updateAttributes(req.body)
	  .success(function(p) { res.send(p);}).error(app.onError(res));
  }).error(function(err) { console.log(err);res.send(err); }); 
});

// delete
app.delete('/api/participants/:id', function (req, res){
  if (!auth.check(req,res)) return;
  models.participants.find(req.params.id).success(function (p) { 
	p.destroy()
	  .success(function(p) { res.send({ok: true});}).error(app.onError(res));
  }).error(function(err) { console.log(err);res.send(err); }); 
});

}