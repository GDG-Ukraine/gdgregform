var models = require('../models');
var auth = require('../auth'),
    db = require('../db');

module.exports = function(app) {
// list
    app.get('/api/info', function (req, res) {
        if (!auth.check(req,res)) return;
        var info = {
            user: req.user
        };
        if (req.user.filter_place) {
            models.places.find(req.user.filter_place).success(function(place) {
                info.place = place.values;
                res.send(info);
            });
        } else res.send(info);
    });
};