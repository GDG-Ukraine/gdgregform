var models = require('../models'),
    auth = require('../auth'),
    Sequelize = require('sequelize'),
    secret = require('../secret');
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
            for (var n=0;n<regs.length;n++) {
                regs[n] = db.copySqObject(regs[n]);
                regs[n].cardUrl = secret.crypt(regs[n].id+"");
                //console.dir(regs[n]);
                //console.log(r);
            }

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

var emailAuth = require('../../config.json').mail;
var sendEmail = function(id) {

}
//approve
var card = require('../card.js');

app.post('/api/events/:id/approve', function (req, res){
    if (!auth.check(req,res)) return false;
    if (!req.body.participants) return res.send(400, "Bad Request - no participants to approve");
    var sendEmail = req.body.sendEmail;
    models.participations.findAll({ where: {event_id:req.params.id}})
        .success(function(regs) {

            for (var i = 0;i<regs.length;i++) {
                if (!regs[i].approved && req.body.participants.indexOf(regs[i].googler_id+"")>-1) {
                    regs[i].updateAttributes({accepted: true});
                    if (sendEmail) card.sendEmail(regs[i].id,req.protocol + "://" + req.get('host')+"/card/",req.user);
                }

            }
            res.send({ok:true});
        });
    return true;
});


}

