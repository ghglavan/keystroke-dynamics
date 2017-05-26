var express = require('express'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    passport = require('passport'),
    mongodb = require('mongodb').MongoClient,
    LocalStrategy = require('passport-local').Strategy,
    bodyParser = require('body-parser'),
    flash = require('express-flash'),
    async = require('async'),
    fs = require('fs');


var registered = false;



//fs.writeFileSync("/gpio/pin25/direction","out");
//initPins({24:"out"});
//writePin(25,0);


var app = express();
var db;

var connected = false;
/*

// We are going to use the database later on..


var url = 'mongodb://localhost:27017/test';
//---------------------------------------database waterfall --------------------

async.waterfall([
  (callback)=>{
    mongodb.connect(url, function(err, response){
    if(err){
      console.log("Avem o eroare:");
      console.log(err);
      return;
    }

    db = response;
        callback();
  });
},
  (callback)=>{

  }
],function(err,res){

});

//---------------------------------------database waterfall --------------------
*/



app.use(flash());
app.use(session({
  secret : "very_secret_much_secure",
  resave : false,
  saveUninitialized : true,
  cookie : { secure : false }  // development => false
}));


app.use(cookieParser("very_secret_much_secure"));
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended : false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');



// 1. secure user name and pass

users = [{
  "_id" : "1",
  "username" : "x2009",
  "password" : "fuckriot12"
}];

// 2. configure passport-local to validate an incoming user and pw

passport.use(new LocalStrategy({passReqToCallback: true},
  function(req,username, password, done){
    console.log(req.body);
    if(connected){
      return done(null,false,{message : "Incorrect credentials. {user already connected}"});
    }

    for(var i = 0; i < users.length ; i++){
      if(users[i].username == username){
        if(users[i].password == password){
          return done(null,users[i])
        }
      }
    }

    return done(null,false,{message : "Incorrect credentials."});


  }
));

// 3. serialize users

passport.serializeUser(function (user, done){

  return done(null,user._id);
  return done(new Error("Cant't serialize this user"));

});

// 4. deserialize users

passport.deserializeUser(function (userId, done) {


      for(var i = 0; i < users.length ; i++){
        if(users[i]._id == userId){

          return done(null,users[i])

        }
      }

  return done(new Error("This user does not exist"));

});

app.post("/login", passport.authenticate('local',{
    failureRedirect : "/",
    succesFlash : { message :  "Welcome!" },
    failureFlash : true
}), function(req,res){
  console.log(req.body);
});

app.post("/register", function(req,res){
  var means = req.body.means;
  var devs = req.body.devs;

  var username = req.body.username;
  var password = req.body.password;

  console.log(means);

});


app.get('/', authenticatedOrNot, function(req, res) {

  if(registered == true){
    res.render(__dirname+'/views/user.ejs', {name : req.user._id});
  }
});


/*
  options -- object of type :
      {
        pin : option
      }
      where pin is an integer between 16 and 47 and option in a string(in or out)

*/

function initPins(options){

  Object.keys(options).forEach(function(pin,index) {
    if(pin > 15 && pin < 48 && (options[pin] == "in" || options[pin] == out))
      fs.writeFileSync("/gpio/pin" + pin + "/direction",options[pin]);
  });

}

function readPin(pin){
  if(pin > 15 && pin < 48){
    var c = fs.readFileSync("/gpio/pin" + pin + "/value");
    return c;
  }
}

function writePin(pin, value){
  if(pin > 15 && pin < 48)
  fs.writeFileSync("/gpio/pin" + pin + "/value",value);
}


function authenticatedOrNot(req, res, next){
  if(req.isAuthenticated()){
    next();
  }else{
    var error = req.flash("error");
    var form  = '';
    if(error && error.length) {
      form = error[0] + form;
    }
    if(registered == true){
      res.render(__dirname +"/views/login.ejs",{m : form});
    }else{
      res.render(__dirname +"/views/register.ejs",{tr : 4});
    }
  }
}

app.listen(8080);
