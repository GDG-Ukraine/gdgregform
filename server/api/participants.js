var models = require('../models');
var auth = require('../auth'),
    db = require('../db');

module.exports = function(app) {

// list
app.get('/api/participants', function (req, res) {
   if (!auth.check(req,res,'god')) return;
   models.participants.findAll().then(function(participants) {
     res.send(participants);
  })
});

function loadEventsForParticipant(id) {
    return models.participants.find(id).then(function(participant) {
        var participantObj = participant.get();
        return participant.getEvents().then(function (events) {
            participantObj.events = events.map(function (event) {
                return event.get();
            });
            return participantObj;
        })
    });
}

// get
app.get('/api/participants/:id', function (req, res) {
    if (!auth.check(req,res,'god')) return;
    if (!req.params.id) return res.send("Invalid request");
    loadEventsForParticipant(req.params.id).
      then(res.json.bind(res)).
      catch(app.onError(res));
});

// create
app.post('/api/participants', function (req, res){
  if (!req.body.user || !req.body.user.email) { return res.send("Incorrect request");};
  models.participants.find({ where: { email: req.body.user.email }})
  .then(function(p) {
    var addToEvent = function(p) {
	   // add to event

       var fields = JSON.stringify(req.body.fields);
	   models.participations.find({ where: {googler_id:p.id,event_id:req.body.event}})
        .done(function(np) {
		    if (np==null)  models.participations.create({googler_id:p.id,event_id:req.body.event, fields: fields});
            else np.updateAttributes({fields: fields});
        });
       };
	var saved = function(p) {
		addToEvent(p);
		res.send(p);
	};
	if (p == null) models.participants.create(req.body.user).then(saved).error(app.onError(res));
  	  else p.updateAttributes(req.body.user).then(saved).error(app.onError(res));
  }).error(app.onError(res));
});

// update
app.put('/api/participants/:id', function (req, res){
  if (!auth.check(req,res,'god')) return;
  models.participants.find(req.params.id).then(function (p) {
	p.updateAttributes(req.body)
	  .then(function(p) {
            loadEventsForParticipant(p)
                .then(res.json.bind(res));
        }).error(app.onError(res));
  }).error(app.onError(res));
});

// delete
/*app.delete('/api/participants/:id', function (req, res){
  if (!auth.check(req,res)) return;
  models.participants.find(req.params.id).then(function (p) {
	p.destroy()
	  .then(function(p) {
            models.participations.findAll({where:{googler_id:req.params.id}}).done(function(regs) {
                regs.forEach(function(reg) { reg.destroy();});
                res.send({ok: true});
            });
        }).error(app.onError(res));
  }).error(function(err) { console.log(err);res.send(err); });
});
*/
}
