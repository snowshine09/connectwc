var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var LdapStrategy = require('passport-ldapauth');
// var OPTS = {
//   server: {
//     url: 'ldaps://dirapps.aset.psu.edu:636',
//     bindCredentials: 'secret',
//     searchBase: 'dc=psu,dc=edu',
//     searchFilter: '(uid={{username}})'
//   }
// };
var OPTS = {
  server: {
    url: 'ldap://dirapps.aset.psu.edu',
    searchBase: 'dc=psu,dc=edu',
    searchFilter: '(uid={{username}})'
  }
};
// var configAuth = require('./auth');
var isValidPassword = function(user, password){
  return bCrypt.compareSync(password, user.password);
};
var User = require('../app/models/user');

module.exports = function(passport) {
  console.log("enter passport");
  passport.serializeUser(function(user, done) {
    console.log("serializeUser");
    console.log(user.id);
    console.dir(user);
    done(null, user._id);
  });

  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use(new LocalStrategy(function(username, password, done) {
    console.log("enter passport local strategy");
    process.nextTick(function() {
      User.findOne({
        'username': username, 
      }, function(err, user) {
        if (err) {
          console.log("error in user findOne");
          return done(err);
        }

        if (!user) {
          console.log('User Not Found with username '+username);
          return done(null, false);
        }
        var tempuser = user.toObject();
        if (tempuser.password != password) {

          console.log('%s %s is a %s.', tempuser.tempuser,tempuser.password,tempuser.email);
          console.log("see if it contains password " + tempuser.hasOwnProperty('password'));
          console.log('length is ');
          var temp = user.toObject();
          console.log("user info is" + user +" type is" + typeof user);
          console.dir("user.username is " + user.username);
          console.dir("temp.username is " + temp.username);
          console.dir("user['password'] is " + user['password']);
          console.log('Invalid Password'+user.password+' VS '+password);
          console.log("user info is" + user +" type is" + typeof user);
          return done(null, false);
        }
        return done(null, user.toObject());
      });
    });
  }));
  
  passport.use(new LdapStrategy(OPTS));
}
