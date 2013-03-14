var path = require('path'),
    db = require('./db'),
    models = require('./models'),
    secret = require('./secret'),
    ejs = require('ejs'),
    fs = require('fs'),
    juice = require('juice'),
    nodemailer = require('nodemailer')
    ;

var prepareData = function (id, url, cb) {

    models.participations.find(id)
        .success(function (reg) {
            reg.getEvent().success(function (event) {
                reg.getParticipant().success(function (user) {
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
                    for (var f in user) {
                        if (user[f] && data[f]) fields[data[f]] = user[f];
                    }
                    if (event.fields && reg.fields) {
                        var cfields = JSON.parse(event.fields);
                        var cdata = JSON.parse(reg.fields);

                        for (var f in cfields) {
                            fields[cfields[f].title] = cdata[cfields[f].name];
                        }
                    }

                    //var qrData = url + "/card/" + secret.crypt(reg.id + "");
                    var qrData = vCardText(user,reg,url + "/card/" + secret.crypt(reg.id + ""));
                    console.log("qr:"+qrData);
                    var locals = {fields: fields, event: event, reg: reg, qrdata: qrData, user: user};
                    cb(locals);
                });
            })
        });
};

var querystring = require("querystring");
var vCardText = function(user,reg,url) {
    var text =
        "BEGIN:VCARD\n"+
        "VERSION:2.1\n"+
        "N:"+user.name+";"+user.surname+"\n"+
        "EMAIL;TYPE=INTERNET:"+user.email+"\n"+
        "NOTE:REG:"+reg.id+" EV:"+reg.event_id+"\n"+
        "URL:"+url+"\n"+
        "END:VCARD";
    //return querystring.stringify(text);
    return encodeURIComponent(text);

}

var mailConfig = require('../config.json').mail;
exports.createMailer = function (sender) {
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
        sendEmail: function (id, url, cb) {
            prepareData(id, url, function (locals) {
                var html = ejs.render(fs.readFileSync('./public/card.html') + "", locals);
                juice.juiceContent(html, {url: url + "/"}, function (err, html) {

                    html = html.replace(/&amp;/g, '&');

                    var mailOptions = {
                        from: "GDG Kyiv <mail@gdg.kiev.ua>", // sender address
                        to: locals.user.email,
                        subject: "✔ Registration confirmation to " + locals.event.title, // Subject line
                        generateTextFromHTML: true,
                        forceEmbeddedImages: true,
                        html: html // html body
                    };
                    smtpTransport.sendMail(mailOptions, function (error, response) {
                        if (error) {
                            console.log(error);
                            cb(false);
                        } else {
                            console.log("Message sent: " + response.message);
                            cb(true);
                        }


                    });
                });
            })
        },
        close: function () {
            // if you don't want to use this transport object anymore, uncomment following line
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
};
