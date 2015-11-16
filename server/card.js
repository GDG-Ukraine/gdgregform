var path = require('path'),
    db = require('./db'),
    models = require('./models'),
    secret = require('./secret'),
    ejs = require('ejs'),
    fs = require('fs'),
    juice = require('juice2'),
    nodemailer = require('nodemailer')
    ;

var prepareData = function (id, url, cb) {
    console.log("preparing card for for ",id);
    models.participations.find(id)
        .done(function (reg) {
            reg.getEvent().done(function (event) {
                reg.getParticipant().done(function (user) {
                    var data = {
                        "name": "Name",
                        "surname": "Surname",
                        "nickname": "Nick",
                        "phone": "Phone",
                        "gplus": "Google+",
                        "home": "Home",
                        "www": "WWW",
                        "experience_level": "Expirience Level",
                        "experience_desc": "Expirience Desc",
                        "interests": "Interests",
                        "events_visited": "Events visited",
                        "english_knowledge": "English",
                        "t_shirt_size": "T-shirt",
                        "gender": "Gender",
                        "additional_info": "Additional"
                    };
                    var fields = {};
                    for (var userN in user.values) {
                        if (user[userN] && data[userN]) fields[data[userN]] = user[userN];
                    }
                    if (event.fields && reg.fields) {
                        var cfields = event.fields ? JSON.parse(event.fields) : {};
                        //console.log("parsing",reg.fields);
                        // temporary hack:
                        if (reg.fields && reg.fields[1] == "'") reg.fields = reg.fields.replace(/'/g, '"');
                        var cdata = reg.fields ? JSON.parse(reg.fields) : {};

                        for (var fieldN in cfields) {
                            fields[cfields[fieldN].title] = cdata[cfields[fieldN].name] || '';
                        }
                    }

                    //var qrData = url + "/card/" + secret.crypt(reg.id + "");
                    var qrData = vCardText(user, reg, url + "/card/" + secret.crypt(reg.id + ""));
                    var confirmData = { url: url + "/confirm/" + secret.crypt(reg.id + "")}
                    // console.log("qr:"+qrData);
                    var locals = {fields: fields, event: event, reg: reg, qrdata: qrData, user: user, confirm: confirmData};
                    cb(locals);
                });
            })
        });
};

//var querystring = require("querystring");
var vCardText = function (user, reg, url) {
    var text =
        "BEGIN:VCARD\n" +
            "VERSION:2.1\n" +
            "N:" + user.name + ";" + user.surname + "\n" +
            "EMAIL;TYPE=INTERNET:" + user.email + "\n" +
            "NOTE:REG:" + reg.id + " EV:" + reg.event_id + "\n" +
            "URL:" + url + "\n" +
            "END:VCARD";
    //return querystring.stringify(text);
    return encodeURIComponent(text);

};

//var mailConfig = require('../config.js').mail;
exports.createMailer = function (sender,from) {
    console.log("mailer from",from);
    var config = {
        host: "smtp.gmail.com",
        secureConnection: true,
        port: 465,
        auth: {XOAuth2: {
            user: sender.email,
            clientId: "655913597185.apps.googleusercontent.com",
            clientSecret: "Qp_OB2nlEhKzaaFeQnwRVMS7",
            refreshToken: sender.refreshToken,
            accessToken: sender.accessToken,
            timeout: 3600
        }}
    };

    var smtpTransport = nodemailer.createTransport("SMTP", /* mailConfig*/config);
    return {
        sendEmail: function (options, cb) {
            var id = options.id;
            var url = options.url;

            prepareData(id, url, function (locals) {
                locals.options = options;
                var html = ejs.render(fs.readFileSync(options.template) + "", locals);
                juice.juiceContent(html, options.htmlPath?{url:options.htmlPath}:{url: url + "/"}, function (err, html) {
                    if (err) {
                        console.log("Error creating HTML for sending email:", err);
                        cb(false);
                        return;
                    }
                    html = html.replace(/&amp;/g, '&');

                    var mailOptions = {
                        //from: "GDG Kyiv <mail@gdg.kiev.ua>", // sender address
                        from: "GDG Registration System <"+(from?from:"mail@gdg.kiev.ua")+">",
                        to: locals.user.email,
                        subject: options.title + locals.event.title, // Subject line
                        generateTextFromHTML: true,
                        forceEmbeddedImages: false,
                        html: html,
                        attachments: [
                        ]
                    };
                    if (options.attach) options.attach.forEach(function(f) {
                        mailOptions.attachments.push({
                            filePath:options.htmlPath+f,
                            filename:f
                        })
                    })
                    if (options.qr) {
                        mailOptions.attachments.push({
                            filePath: 'http://chart.googleapis.com/chart?chs=400x400&cht=qr&chl=' + locals.qrdata + '&choe=UTF-8',
                            fileName: 'RegistrationQR.png'
                        });
                    }
                    smtpTransport.sendMail(mailOptions, function (error, response) {
                        if (error) {
                            console.log(error);
                            cb(false);
                        } else {
                            console.log("Message from "+mailOptions.from+" to "+locals.user.email+" sent: " + response.message);
                            cb(true);
                        }
                    });
                });
            })
        },
        sendCardEmail: function (options, cb) {
            options.title = "✔ Registration confirmation to ";
            options.qr = true;
            options.template = "./public/card.html";
            return this.sendEmail(options, cb);
        },
        sendConfirmEmail: function (options, cb) {
            options.title = "Please confirm your visit to ";
            options.template = "./public/confirmation/mail.html";
           // options.attach = ['gdg_org_ua.png'];
            options.htmlPath = options.url+"/confirmation/";

            return this.sendEmail(options, cb);
        },
        close: function () {
            smtpTransport.close(); // shut down the connection pool, no more messages

        }
    }
}

exports.setup = function (app) {
    app.get('/card/:id', function showCard(req, res) {
        var id;
        try {
            id = secret.decrypt(req.params.id);
        } catch (err) {
            return res.send(400, "Invalid card number");
        }
        prepareData(id, req.protocol + "://" + req.get('host'), function (locals) {
            res.render('card.html', locals);
        });
    });
    app.get('/confirm/:id',function showCard(req, res) {
        var id;
        try {
            id = secret.decrypt(req.params.id);
        } catch (err) {
            return res.send(400, "Invalid confirmation number");
        }
        models.participations.find(id).done(function (reg){
            reg.updateAttributes({confirmed:true}).done(function() {
                res.render('confirmation/confirmed.html');
            });
        });

    });
};
