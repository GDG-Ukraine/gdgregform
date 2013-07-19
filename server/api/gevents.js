var models = require('../models'),
    auth = require('../auth'),
    Sequelize = require('sequelize'),
    secret = require('../secret');
db = require('../db');

module.exports = function (app) {

function loadEvent(id, cb) {
    chainer = new Sequelize.Utils.QueryChainer();
    chainer
        .add(models.gevents.find(id))
        .add(models.participations.findAll({where: {event_id: id},include:[{model:models.participants,as:"Participant"}]}))
        .run()
        .success(function(results) {
            var e = results[0],
                regs = results[1];
            if (!e) {
                cb("no event",null);
                return;
            }
            if (e.fields) e.fields = JSON.parse(e.fields);
            for (var n = 0; n < regs.length; n++) {
                regs[n] = db.copySqObject(regs[n]);
                regs[n].cardUrl = secret.crypt(regs[n].id + "");
            }
            var nE = e.values;
            nE.registrations = regs;
            cb(null,nE);
        }).error(function(e) { cb("Cant load"+e,null);});
}
function checkAccessToEvent(req,res,id) {
    if (req.user.filter_place && req.user.filter_place != id) {
        res.send(401, "User is not allowed to access this GDG host");
        return false;
    }
    return true;
}
// get
    app.get('/api/events/:id', function (req, res) {
        if (!auth.check(req, res)) return;
        if (!req.params.id) return res.send(404,"Not found");
        loadEvent(req.params.id, function(err,data) {
          if (err) app.onError(res)(err);
          else if (!checkAccessToEvent(req, res,data.host_gdg_id)) return;
          else res.send(data);
        });
    });
// create 
    app.post('/api/events', function (req, res) {
        if (!auth.check(req, res)) return;
        if (req.user.filter_place) req.body.host_gdg_id = req.user.filter_place;
        if (req.body.fields) req.body.fields = JSON.stringify(req.body.fields);
        models.gevents.create(req.body).success(function (p) {
            res.send(p);
        }).error(app.onError(res));
    });
// update
    app.put('/api/events/:id', function (req, res) {
        if (!auth.check(req, res)) return;
        if (req.body.fields) req.body.fields = JSON.stringify(req.body.fields);
        models.gevents.find(req.params.id).success(function (event) {
            if (!checkAccessToEvent(req, res,event.host_gdg_id)) return;
            event.updateAttributes(req.body)
                .success(function (p) {
                    res.send(p);
                }).error(app.onError(res));
        }).error(app.onError(res));
    });
// delete
    app.delete('/api/events/:id', function (req, res) {
        if (!auth.check(req, res)) return;
        models.gevents.find(req.params.id).success(function (event) {
            if (!checkAccessToEvent(req, res,event.host_gdg_id)) return;
            event.destroy()
                .success(function (p) {
                    models.participations.findAll({where: {event_id: req.params.id}}).success(function (regs) {
                        regs.forEach(function (reg) {
                            reg.destroy();
                        });
                        res.send({ok: true});
                    });

                }).error(app.onError(res));
        }).error(app.onError(res));
    });
// list
    app.get('/api/events', function (req, res) {
        if (!auth.check(req, res)) return;
        var filter = req.user && req.user.filter_place?{where:{host_gdg_id:req.user.filter_place}}:{};
        models.gevents.findAll(filter).success(function (events) {
            res.send(events);
        }).error(app.onError(res));
    });

    var emailAuth = require('../../config.js').mail;
    var sendEmail = function (id) {

    }
//approve
    var card = require('../card.js');

    app.post('/api/events/:id/approve', function (req, res) {
        if (!auth.check(req, res)) return false;
        if (!req.body.registrations) return res.send(400, "Bad Request - no participants to approve");
        var sender;
        if (req.body.sendEmail)
            sender = card.createMailer(req.user);
        models.participations.findAll({ where: {event_id: req.params.id}})
            .success(function (regs) {
                var success = true;
                waitFor = 0;
                for (var i = 0; i < regs.length; i++) {
                    if (!regs[i].approved && req.body.registrations.indexOf(regs[i].id + "") > -1) {
                        var approve = function approveRegistration(reg) {
                            waitFor++;
                            var sendCb = function (result) {
                                if (!result) {
                                    reg.updateAttributes({accepted: false});
                                    success = false;
                                }

                                if (--waitFor == 0) {
                                    if (sender) sender.close();
                                    res.send({ok: success});
                                }
                            };
                            reg.updateAttributes({accepted: true}).success(function () {

                                if (sender)
                                    sender.sendEmail(reg.id, req.protocol + "://" + req.get('host'), sendCb);
                                else sendCb(true);

                            });
                        };
                        approve(regs[i]);
                    }
                }
                //res.send({ok:true});
            }).error(app.onError(res));
        ;
        return true;
    });
    app.post('/api/events/:id/resend', function (req, res) {
        if (!auth.check(req, res)) return false;
        if (!req.body.id) return res.send(400, "Bad Request - no participation to send");
        var sender = card.createMailer(req.user);
        models.participations.find({ where: {event_id: req.params.id, googler_id:req.body.id}})
            .success(function (reg) {
                sender.sendEmail(reg.id, req.protocol + "://" + req.get('host'), function(result){
                    res.send({ok:result});
                });
            });
    });

    // Delete participation request

    app.post('/api/events/:id/delete', function (req, res) {
        if (!auth.check(req, res)) return false;
        if (!req.body.id) return res.send(400, "Bad Request - no participation to delete");
        models.participations.find({ where: {event_id: req.params.id, googler_id:req.body.id}})
            .success(function (reg) {
                reg.destroy();
                res.send({ok:true});
            });
    });
    var https = require('https');

    // generate report

    app.post('/api/events/:id/report', function(req, res) {
        if (!auth.check(req, res)) return false;
        loadEvent(req.params.id, function(err, event) {
            if (err) return app.onError(res);
            if (!checkAccessToEvent(req, res,event.host_gdg_id)) return;

            var https = require('https');
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";
        const contentType = 'text/csv';
        var metadata = {
            'title': "Registrations to "+event.title,
            'mimeType': contentType
        };
        var dfields = ["name","surname","nickname","email","phone","gplus","hometown","company",
                "position","www","experience_level","experience_desc","interests","events_visited",
                "english_knowledge","t_shirt_size","gender","additional_info"];
        var fields = dfields.slice(0);
        fields.unshift("reg#");
        for (var fn in event.fields) {
            var s = event.fields[fn].name;
            if (s.indexOf('"')>=0) s = s.replace(/"/g,'""');
            fields.push(s);
        }

        function findReg(id) {
            for (var n in event.registrations)
                if (event.registrations[n].googler_id==id) return event.registrations[n];
            return null;
        }
        var data = '"'+fields.join('","')+'"\n';
        for (var n = 0;n<event.registrations.length;n++) {
            var p = event.registrations[n].participant;
            var reg = event.registrations[n];
            var fdata = JSON.parse(reg.fields)||{};
            if (req.query.mode=='approved' && !reg.accepted) continue;
            if (req.query.mode=='waiting' && reg.accepted) continue;
            var cols = [];
            fields.forEach(function(field) {
                if (field=='reg#') cols.push(reg.id);
                else {
                var s = p[field];
                if (!s) {
                    s = fdata[field];
                    if (!s) s = '';
                }
                if (s.indexOf('"')>=0) s = s.replace(/"/g,'""');
                cols.push(s);
                }
            });
            data += '"'+cols.join('","')+'"\n';
        }
        var base64Data = new Buffer(data).toString('base64');
        var multipartRequestBody =
            delimiter +
                'Content-Type: application/json\r\n\r\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: ' + contentType + '\r\n' +
                'Content-Transfer-Encoding: base64\r\n' +
                '\r\n' +
                base64Data +
                close_delim;

        var options = require('url').parse('https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart&convert=true');
        options.headers = {
            Authorization: "Bearer " + req.user.accessToken,
            "Content-Length":multipartRequestBody.length,
            'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        };
        options.method = 'POST';

        var r = https.request(options, function(hres) {
            console.log("Got response: " + hres.statusCode);
            var data = '';
            hres.on('data', function (chunk) {
                //console.log('BODY: ' + chunk);
                data += chunk;
            });
            hres.on('end', function() {
                var r = JSON.parse(data);
                if (hres.statusCode == 200)
                    res.send({url: r.alternateLink});
                else {
                    res.send({message:hres.statusText, data:data});
                    console.log("error sending to drive:", hres.statusCode, hres.statusText, data);
                }
            });

        }).on('error', function(e) {
                console.log("Got error: " + e.message);
                res.send({ok:fase});
        });
        r.write(multipartRequestBody);
        r.end();
        });
    });
}

