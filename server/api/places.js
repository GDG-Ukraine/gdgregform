var models = require('../models');
var auth = require('../auth'),
    db = require('../db');

module.exports = function(app) {
// list
    app.get('/api/places', function (req, res) {
        if (!auth.check(req,res)) return;
        models.places.findAll().success(function(places) {
            res.send(places);
        });
    });
};
