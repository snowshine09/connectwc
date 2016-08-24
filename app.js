var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var morgan = require('morgan');
var configDB = require('./config/database');

var session = require('express-session');

var routes = require('./routes/index');
var users = require('./routes/users');

var student = require('./models/user.js');

var app = express();
var expressHbs = require('express-handlebars');

//database connect
mongoose.connect(configDB.url);

//authentication
require('./config/passport')(passport);

// passport set up
app.use(session({ secret: 'weare' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('hbs', expressHbs({extname:'hbs', defaultLayout:'main.hbs'}));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev'));

app.use('/', routes);
app.use('/users', users);



app.get('/', isLoggedIn, function(req, res) {
  console.log("home in router is " + req.session.passport.user);
  // var newAct = new UserAct({
  //  username: req.user.username,
  //  type: "User enter home page"
  // });
  // newAct.save(function(err, nact) {
  //  if (err) {
  //    console.err(err);
  //    console.log("err occurs when saving new user act");
  //  }
  //  console.log("new useract added");
  // });
  student.findOne({
    username: req.user.toObject().username
  }, 'topics', function(err, user) {
    if (err) handleError(err);
    
    console.log("this is after logging in!");
    res.render('index.hbs', {
      name: req.user.toObject().name
    });
  });

});

app.get('/login', function(req, res) {
  res.render('login.hbs');
});

app.get('/logout', function(req, res) {
  console.log('log out');
  
  req.logout();

  res.redirect('/login');
});

app.post('/userlogin', function(req, res, next) {
  console.log("enter user login");
    // passport.authenticate('local', function(err, user, info) {
    //   if (err) { return next(err); }
    //   if (!user) { return res.redirect('/login'); }
    //   req.logIn(user, function(err) {
    //     if (err) { return next(err); }
    //     var newAct = new UserAct({
    //       type: "user login",
    //       username: user.username
    //     });
    //     newAct.save(function(err,nact){
    //       if(err){
    //         console.err(err);
    //         console.log("err occurs when saving new user act");
    //       }
    //       console.log("new useract added");
    //     });
    //     return res.redirect('/home');
    //   });
    // })(req, res, next); 
    passport.authenticate('ldapauth', {
      session: true
    }, function(err, user, info) {
      if (err) {
        return next(err);
      }

      if (!user) {
        console.log("Your password is incorrect");
        return res.redirect('/login');
      }
      console.log('enter ldapauth, the user who is logged is listed as follows:');
      console.dir(user);
      student.findOne({
        student_id: user.uid
      }, function(err, result) {
        if (err) {
          console.log("there is an err in student.findOne for PSU account log in");
          console.err(err);
        }
        console.log("the result is" + result);
        if (!result) {

          console.log('not exist before');
          
          if (err) handleError(err);
          var localUser = new student({
            student_id: user.uid,
            name: user.displayName,
            prev_degree: user.title=='GRAD STUDENT'?'Bachelor degree':'',
            title: user.psCurriculum,
            email: user.mail
          });
          localUser.save(function(err, newuser) {
            if (err) return console.error(err);
            console.log("user is saved");

            req.logIn(newuser, function(err) {
              console.log("enter req.logIn");
              if (err) {
                console.log("enter err!!! in req.logIn");
                console.log("the err is " + err);
                return next(err);
              }
              return res.redirect('/');
            });

          });


        } else {
          console.log("user is existing");
          req.logIn(result, function(err) {
            console.log("enter req.logIn");
            // var newAct = new UserAct({
            //   type: "user login",
            //   username: result.username
            // });
            // newAct.save(function(err, nact) {
            //   if (err) {
            //     console.err(err);
            //     console.log("err occurs when saving new user act");
            //   }
            //   console.log("new useract added");
            // });
            if (err) {
              console.log("enter err!!! in req.logIn");
              console.log("the err is " + err);
              return next(err);
            } else return res.redirect('/');
          });
        }
      });
      console.log("leaving user login");

      console.log("after auth, what is the req and res");
    })(req, res, next);
  });


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    console.log("it is authenticated in is LoggedIn");
    return next();
  }
  res.redirect('/login');
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
