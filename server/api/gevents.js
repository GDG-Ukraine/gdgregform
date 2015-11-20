var models = require('../models'),
    auth = require('../auth'),
    Sequelize = require('sequelize'),
    secret = require('../secret');
db = require('../db');

module.exports = function (app) {

    function loadEvent(id, cb) {
        return models.gevents.find(id).then(function (event) {
            if (!event) throw new Error("There is no such event");

            var eventObj = event.get();
            if (eventObj.fields) eventObj.fields = JSON.parse(eventObj.fields);
            if (eventObj.hidden) {
                try {
                    eventObj.hidden = JSON.parse(eventObj.hidden);
                } catch(e) {
                    // eventObj.hidden[0] != '['
                    eventObj.hidden = eventObj.hidden.split(',');
                }
            }

            return Sequelize.Promise.
                all([event.getParticipants(), event.getInvites()]).
                then(function (res) {
                    eventObj.registrations = res[0].map(function (row) {
                        var _res = row.get();
                        _res.cardUrl = secret.crypt(_res.id + "");
                        _res.gdg_events_participation = _res.gdg_events_participation.get();
                        return _res
                    });
                    eventObj.invites = res[1].map(function (row) {
                        return row.get()
                    });
                    return eventObj;
                });
        });
    }

    function checkAccessToEvent(req, res, id) {
        if (!req.user || req.user && req.user.filter_place != id && !req.user.godmode) {
            res.send(401, "User is not allowed to access this GDG host");
            console.log("Denying access to event", id, "for", req.user);
            return false;
        }
        return true;
    }

// get
    app.get('/api/events/:id', function (req, res) {
        if (!auth.check(req, res)) return;
        if (!req.params.id) return res.send(404, "Not found");

        loadEvent(req.params.id).then(function (event) {
            if (!checkAccessToEvent(req, res, event.host_gdg_id))
                throw new Error("Access denied to this event");
            res.send(event);
        }).catch(function (e) {
            app.onError(res)("Can't load event: " + err);
        })
    });
// create
    app.post('/api/events', function (req, res) {
        if (!auth.check(req, res)) return;
        if (req.user.filter_place) req.body.host_gdg_id = req.user.filter_place;
        if (req.body.fields) req.body.fields = JSON.stringify(req.body.fields);
        models.gevents.create(req.body).then(function (p) {
            res.send(p);
        }).error(app.onError(res));
    });
// update
    app.put('/api/events/:id', function (req, res) {
        if (!auth.check(req, res)) return;
        if (req.body.fields) req.body.fields = JSON.stringify(req.body.fields);
        if (req.body.hidden) req.body.hidden = JSON.stringify(req.body.hidden);
        if (req.user.filter_place != req.body.host_gdg_id && req.user.godmode!=1)
            return res.end("You can't change host gdg id - you'll loose control on it");
        models.gevents.find(req.params.id).then(function (event) {
            if (!checkAccessToEvent(req, res, event.host_gdg_id)) return;
            event.updateAttributes(req.body)
                .then(function (p) {
                    res.send(p);
                }).error(app.onError(res));
        }).error(app.onError(res));
    });
// delete
    app.delete('/api/events/:id', function (req, res) {
        if (!auth.check(req, res)) return;
        models.gevents.find(req.params.id).then(function (event) {
            if (!checkAccessToEvent(req, res, event.host_gdg_id)) return;

            models.participations.findAll({where: {event_id: req.params.id}}).done(function (regs) {
                var chain = new (require('sequelize')).Utils.QueryChainer;

                regs.forEach(function (reg) {
                    chain.add(reg.destroy());
                });
                chain.run().done(function () {
                    event.destroy().then(function () {
                        res.send({ok: true});
                    }).error(app.onError(res));
                });
            });
        }).error(app.onError(res));
    });
// list
    app.get('/api/events', function (req, res) {
        if (!auth.check(req, res)) return;
        var filter = req.user && req.user.filter_place && req.user.godmode!=1 ? {where: {host_gdg_id: req.user.filter_place}} : {};
        models.gevents.findAll(filter).then(function (events) {
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
        var sender, waitFor;
        if (req.body.sendEmail)
            sender = card.createMailer(req.user,req.body.fromEmail);
        models.participations.findAll({ where: {event_id: req.params.id}})
            .then(function (regs) {
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
                            reg.updateAttributes({accepted: true}).done(function () {

                                if (sender)
                                    sender.sendCardEmail({id: reg.id, url: req.protocol + "://" + req.get('host')}, sendCb);
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

    app.post('/api/events/:id/send-confirm', function (req, res) {
        if (!auth.check(req, res)) return false;
        if (!req.body.registrations) return res.send(400, "Bad Request - no participants to approve");
        var sender, waitFor;

        sender = card.createMailer(req.user,req.body.fromEmail);

        models.participations.findAll({ where: {event_id: req.params.id}})
            .then(function (regs) {
                var success = true;
                waitFor = 0;
                for (var i = 0; i < regs.length; i++) {
                    if (req.body.registrations.indexOf(regs[i].id + "") > -1) {
                        var approve = function approveRegistration(reg) {
                            waitFor++;
                            var sendCb = function () {
                                if (--waitFor == 0) {
                                    if (sender) sender.close();
                                    res.send({ok: success});
                                }
                            };
                            sender.sendConfirmEmail({id: reg.id, url: req.protocol + "://" + req.get('host')}, sendCb);
                        };
                        approve(regs[i]);
                    }
                }
            }).error(app.onError(res));
        ;
        return true;
    });

    app.post('/api/events/:id/resend', function (req, res) {
        if (!auth.check(req, res)) return false;
        if (!req.body.id) return res.send(400, "Bad Request - no participation to send");
        var sender = card.createMailer(req.user);
        models.participations.find({ where: {event_id: req.params.id, googler_id: req.body.id}})
            .done(function (reg) {
                sender.sendCardEmail({id: reg.id, url: req.protocol + "://" + req.get('host')}, function (result) {
                    res.send({ok: result});
                });
            });
    });

    // Delete participation request

    app.post('/api/events/:id/delete', function (req, res) {
        if (!auth.check(req, res)) return false;
        if (!req.params.id) return res.send(400, "Bad Request - no participation to delete");
        //models.participations.find({ where: {event_id: req.params.id, googler_id:req.body.id}})
        models.participations.find({ where: {event_id: req.params.id, id: req.body.id}})
            .done(function (reg) {
                reg.destroy().then(function () {
                    //reg.updateAttributes({deleted: true}).done(function () {
                    res.send({ok: true});
                }).fail(function () {
                        res.send({ok: false})
                    });
            });
    });
    var https = require('https');
    // generate report
    app.post('/api/events/:id/invites', function(req, res) {
        if (!auth.check(req, res)) return false;
        console.log("Generating ", req.body.number,"invites");
        chainer = new Sequelize.Utils.QueryChainer();
        for (var i = 0;i<req.body.number;i++) {
            var code = require('../secret').crypt('invite'+i+(Math.random()));
            console.log('code:'+code);
            chainer.add(models.invites.create({code: code, event_id: req.params.id,used:false}));
        }
        chainer
            .run()
            .then(function() {
                res.json({ok:true});
            })
            .error(app.onError(res));
    })

    app.post('/api/events/:id/report', function (req, res) {
        if (!auth.check(req, res)) return false;
        loadEvent(req.params.id, function (err, event) {
            if (err) return app.onError(res);
            if (!checkAccessToEvent(req, res, event.host_gdg_id)) return;

            var https = require('https');
            //const boundary = '-------314159265358979323846';
            const boundary = '314159265358979323846';
            const delimiter = "--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--\r\n";
            const contentType = 'text/csv';
            var metadata = {
                'title': "Registrations to " + event.title,
                //'title': "Registrations to "+event.id,
                'mimeType': contentType
            };
            var dfields = ["name", "surname", "nickname", "email", "phone", "gplus", "hometown", "company",
                "position", "www", "experience_level", "experience_desc", "interests", "events_visited",
                "english_knowledge", "t_shirt_size", "gender", "additional_info"];
            var fields = dfields.slice(0);
            fields.unshift("reg#");
            for (var fn in event.fields) {
                var s = event.fields[fn].name;
                if (s.indexOf('"') >= 0) s = s.replace(/"/g, '""');
                fields.push(s);
            }

            function findReg(id) {
                for (var n in event.registrations)
                    if (event.registrations[n].googler_id == id) return event.registrations[n];
                return null;
            }

            var data = '"' + fields.join('","') + '"\n';
            for (var n = 0; n < event.registrations.length; n++) {
                var p = event.registrations[n].participant;
                var reg = event.registrations[n];
                var fdata;
                try {
                    fdata = JSON.parse(reg.fields); } catch(err) {
                    console.log("Error parsing JSON fields:",reg.fields);
                }
                if (!fdata) fdata = {};
                if (req.query.mode == 'approved' && !reg.accepted) continue;
                if (req.query.mode == 'waiting' && reg.accepted) continue;
                var cols = [];
                fields.forEach(function (field) {
                    if (field == 'reg#') cols.push(reg.id);
                    else {
                        var s = p[field];
                        if (!s) {
                            s = fdata[field];
                            if (!s) s = '';
                        }
                        if (typeof s === 'string' && s.indexOf('"') >= 0) s = s.replace(/"/g, '""');
                        cols.push(s);
                    }
                });
                data += '"' + cols.join('","') + '"\n';
            }

            var base64Data = new Buffer(data).toString('base64');
            var multipartRequestBody =
                delimiter +
                    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                    JSON.stringify(metadata) +
                    '\r\n' + delimiter +
                    'Content-Type: ' + contentType + '; charset=UTF-8\r\n' +
                    'Content-Transfer-Encoding: base64\r\n' +
                    '\r\n' +
                    base64Data +
                    close_delim;

            var options = require('url').parse('https://www.googleapis.com/upload/drive/v2/files?uploadType=multipart&convert=true');
            options.headers = {
                Authorization: "Bearer " + req.user.accessToken,
                "Content-Length": multipartRequestBody.length,
                'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
            };
            options.method = 'POST';

            var r = https.request(options,function (hres) {
                console.log("Got response: " + hres.statusCode);
                var data = '';
                hres.on('data', function (chunk) {
                    //console.log('BODY: ' + chunk);
                    data += chunk;
                });
                hres.on('end', function () {
                    try {
                        var r = JSON.parse(data);
                        if (hres.statusCode == 200)
                            res.send({url: r.alternateLink});
                        else {
                            res.send({message: hres.statusText, data: data});
                            console.log("error sending to drive:", hres.statusCode, hres.statusText, data);
                        }
                    } catch (e) {
                        res.send({message: hres.statusText, data: data});
                        console.log("error sending to drive:", hres.statusCode, hres.statusText, data);

                    }
                });

            }).on('error', function (e) {
                    console.log("Got error: " + e.message);
                    res.send({ok: false});
                });
            console.log("r:", multipartRequestBody);
            r.write(multipartRequestBody, 'utf8');
            r.end();
        });
    });
}
