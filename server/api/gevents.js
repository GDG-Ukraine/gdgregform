var models = require('../models'),
    auth = require('../auth'),
    Sequelize = require('sequelize'),
    db = require('../db');

module.exports = function(app) {

// get
app.get('/api/events/:id', function (req, res) {
    if (!auth.check(req,res)) return;
    if (!req.params.id) return res.send("Not found");
    models.gevents.find(req.params.id).success(function (e) {
        if (e.fields) e.fields = JSON.parse(e.fields);
        var chainer = new Sequelize.Utils.QueryChainer();
        chainer
        .add(e.getParticipants())
        .add(models.participations.findAll({where: {event_id: req.params.id}}))
        .run()
        .success(function(results) {
            var ps = results[0];
            var regs = results[1];
            var newE = db.copySqObject(e);
            newE.participants = ps;
            newE.registrations = regs;
            res.json(newE);
        });
    }).error(app.onError(res));
});
// create 
app.post('/api/events', function (req, res){
  if (!auth.check(req,res)) return;
  if (req.body.fields) req.body.fields = JSON.stringify(req.body.fields);
  models.gevents.create(req.body).success(function(p) { res.send(p);}).error(app.onError(res));
});
// update
app.put('/api/events/:id', function (req, res){
  if (!auth.check(req,res)) return;
  if (req.body.fields) req.body.fields = JSON.stringify(req.body.fields);
  models.gevents.find(req.params.id).success(function (p) { 
	p.updateAttributes(req.body)
	  .success(function(p) { res.send(p);}).error(app.onError(res));
  }).error(app.onError(res));
});
// delete
app.delete('/api/events/:id', function (req, res){
  if (!auth.check(req,res)) return;
  models.gevents.find(req.params.id).success(function (p) { 
	p.destroy()
	  .success(function(p) {
            models.participations.findAll({where:{event_id:req.params.id}}).success(function(regs) {
                regs.forEach(function(reg) { reg.destroy();});
                res.send({ok: true});
            });

      }).error(app.onError(res));
  }).error(app.onError(res));
});
// list
app.get('/api/events', function (req, res) {
   if (!auth.check(req,res)) return;
   models.gevents.findAll().success(function(participants) {
     res.send(participants);
  })
});

//approve
app.post('/api/events/:id/approve', function (req, res){
    if (!auth.check(req,res)) return false;
    if (!req.body.participants) return res.send(400, "Bad Request - no participants to approve");
    models.participations.findAll({ where: {event_id:req.params.id}})
        .success(function(regs) {

            for (var i = 0;i<regs.length;i++) {
                if (!regs[i].approved && req.body.participants.indexOf(regs[i].googler_id+"")>-1)
                    regs[i].updateAttributes({accepted: true});

            }
            res.send({ok:true});
        });
    return true;
});


}

