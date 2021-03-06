var User = require('../../models').User;
var helpers = require('../apiHelpers.js');
var jwt = require('jsonwebtoken');

var tokenSecret;

if (process.env.NODE_ENV === undefined) {
  //set the token secret inside of our config secrets file
  tokenSecret = require('../../config/secrets').authentication.tokenSecret;
} else {
  tokenSecret = process.env.TOKEN_SECRET;
}

/**
 *    Creates token for users
 *    @param  {[Object]} user [usermodel queried via JSON sent from the Client]
 *    @return {[String]}      [Token that is return to client]
 */
var createToken = function(user) {
  return jwt.sign({
    user: user.username,
    id: user._id
  }, tokenSecret, {
    expiresIn: 86400
  });
};

module.exports = {
  signIn: function(req, res) {
    // look for user in database
    User.findOne({
      'username': req.body.username
    }, function(err, user) {
      //if you find a user
      if (user) {
        user.comparePassword(req.body.password, user.password, function(valid) {
          if (valid) {
            var userToken = createToken(user);
            res.json({
              success: true,
              token: userToken,
              status: user.climb,
              user: helpers.buildUser(user)
            });
          } else {
            res.sendStatus(401);
          }
        });
      } else {
        res.sendStatus(401);
      }
    });
  },
  signUp: function(req, res) {

    User.findOne({
      username: req.body.username
    }, function(err, user) {
      if (err) console.error(err);

      if (user) {
        res.status(401);
        res.json({
          success: false,
          reason: 'User with that username already exists'
        });
      } else {
        var newUser = new User({
          username: req.body.username,
          password: null
        });
        newUser.hashPassword(req.body.password, function(hash) {
          newUser.password = hash;
          newUser.save(function(err, user) {
            if (err) console.error(err);

            var token = createToken(user);
            res.json({
              success: true,
              token: token,
              status: newUser.climb,
              user: helpers.buildUser(user)
            });
          });
        });
      }
    });
  }
};
