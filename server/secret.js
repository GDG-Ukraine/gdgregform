var crypto = require('crypto');

var algorithm = 'aes256'; // or any other algorithm supported by OpenSSL
var key = require('../config').key;

exports.crypt = function(text) {
    var cipher = crypto.createCipher(algorithm, key);
    return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
}

exports.decrypt = function(text) {
    var decipher = crypto.createDecipher(algorithm, key);
    return decipher.update(text, 'hex', 'utf8') + decipher.final('utf8');
}
