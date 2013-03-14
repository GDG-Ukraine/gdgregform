var path = require('path'),
    db = require('./db'),
    models = require('./models'),
    secret = require('./secret'),
    ejs = require('ejs'),
    fs = require('fs'),
    juice = require('juice'),
    nodemailer = require('nodemailer')
    ;

var prepareData = function(id, url, cb) {

    models.participations.find(id)
        .success(function(reg) {
            reg.getEvent().success(function(event) {
                reg.getParticipant().success(function(user) {
                    var data = {
                        "name":"Name",
                        "surname": "Surname",
                        "nickname": "Nick",
                        "phone":"Phone",
                        "gplus": "Google+",
                        "home": "Home",
                        "www":"WWW",
                        "experience_level":"Expirience Level",
                        "experience_desc":"Expirience Desc",
                        "interests":"Interests",
                        "events_visited":"Events visited",
                        "english_knowledge":"English",
                        "t_shirt_size":"T-shirt",
                        "gender":"Gender",
                        "additional_info":"Additional"
                    };
                    var fields = {};
                    for (var f in user) {
                        if (user[f] && data[f]) fields[data[f]] = user[f];
                    }
                    if (event.fields && reg.fields) {
                        var cfields = JSON.parse(event.fields);
                        var cdata = JSON.parse(reg.fields);

                        for(var f in cfields) {
                            fields[cfields[f].title] = cdata[cfields[f].name];
                        }
                    }

                    var qrData = url+"/card/"+secret.crypt(reg.id+"");
                    var locals = {fields:fields,event:event, reg:reg, qrdata: qrData, user: user};
                    cb(locals);
                });
            })
        });
};

var mailConfig = require('../config.json').mail;

exports.sendEmail = function(id,url,sender) {
    prepareData(id,url,function(locals) {
        var html = ejs.render(fs.readFileSync('./public/card.html')+"",locals);
        var config = {
            host:"smtp.gmail.com",
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
        juice.juiceContent(html,{url:url+"/"}, function(err,html) {
            var smtpTransport = nodemailer.createTransport("SMTP",/* mailConfig*/config);

            html = html.replace(/&amp;/g,'&');

            var mailOptions = {
                from: "GDG Kyiv <mail@gdg.kiev.ua>", // sender address
                to: locals.user.email,
                subject: "✔ Registration confirmation to "+locals.event.title, // Subject line
                generateTextFromHTML: true,
                forceEmbeddedImages: true,
                html: html // html body
            };
            smtpTransport.sendMail(mailOptions, function(error, response){
                if(error){
                    console.log(error);
                }else{
                    console.log("Message sent: " + response.message);
                }

                // if you don't want to use this transport object anymore, uncomment following line
                smtpTransport.close(); // shut down the connection pool, no more messages
            });
        });
    })
}

exports.setup = function(app) {
    app.get('/card/:id', function showCard(req,res) {
        var id;
        try {
            id = secret.decrypt(req.params.id);
        } catch(err) {
            return res.send(400,"Invalid card number");
        }
        prepareData(id,req.protocol + "://" + req.get('host'),function(locals) {
            res.render('card.html', locals);
        });
    });
};
