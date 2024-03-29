var express = require('express');
var router = express.Router();
var Student = require('../models/user.js');
var Msg = require('../models/msg.js');
var allstates = require('../models/const.js').allstates;
console.log("type of all states imported is "+typeof(allstates));

var passport = require('passport');

allstatesArr = Object.keys(allstates);


console.log("all states imported is length "+allstatesArr);

/* GET home page. */
// router.get('/', function(req, res, next) {
// 	res.render('index');
// });
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    console.log("it is authenticated in is LoggedIn");
    return next();
  }
  res.redirect('/login');
}

router.get('/graph', isLoggedIn, function(req, res, next) {
	res.render('connected');
});

router.get('/graph/:filter', isLoggedIn, function(req, res, next) {
	res.render('connected',req.params.filter);
});

router.get('/people', isLoggedIn, function(req, res, next) { //render browsing table for all the students
	Student.find({}).exec(function(err, students) {
		res.render('table', {'students':students});
	});
	
})

router.get('/students/bystate/:state', isLoggedIn, function(req, res, next){
	console.log('filter students by state '+req.params.state);
	console.dir(req.body);
	Student.find({'RES': new RegExp(req.params.state, 'i')}).exec(function(err, students) {
		var rt_students = [];
		for(var i=0; i<students.length; i++){
			console.log(students[i].RES.split(',')[1].replace(/ /g,''));
			if(students[i].RES.split(',')[1].replace(/ /g,'')==req.params.state)rt_students.push(students[i]);
		}
		console.log('There is ' + rt_students.length + 'students in state' + req.params.state)
		res.send(rt_students);
	});
});

router.get('/students', function(req, res, next){
	console.log('all students in');
	Student.find({}).exec(function(err, students) {
		res.send(students);
	});
});

router.get('/filterbystate', isLoggedIn, function(req, res, next){
	console.log('in filterbystate');
	Student.find({'RES': new RegExp(req.body.state, 'i')}, function(err, docs){
		res.send(filteredstudents);
	});
})

router.get('/locationcount', function(req, res, next){
	console.log('locationcount in');
	var state_count={};
	for(var i = 0; i < allstatesArr.length; i++){
		state_count[allstatesArr[i]]={};
		state_count[allstatesArr[i]]['count']=0;
		state_count[allstatesArr[i]]['name'] = allstates[allstatesArr[i]];
		state_count[allstatesArr[i]]['abbr'] = allstatesArr[i];
		state_count[allstatesArr[i]]['fillKey']='LOW';
	}

	//test, suppose the session user is czf5234
	Student.find({}).exec(function(err, students) {
		console.log("enter the student find");
		if(err) {
			handleError(err);
			console.log("err: " + err);
		};
		console.log(state_count);
		for(var k  = 0; k < students.length; k++){
			var std = students[k];
			locList = std['RES'].replace(/ /g,'').split(',');
			if(locList[2]=="US"){
				var key = locList[1];
			 	// console.log(state_count);
			 	// console.log("key is : " + key);
			 	// if(key.length>2){
			 	// 	console.log("length > 2 is " + key);
			 	// }
			 	if(state_count[key]['count']){
			 		console.log('count is 0 for ' + key);
			 		state_count[key]['count']+=1
			 		console.log("now it is changed to "+state_count[key]['count']);
			 		state_count[key]['list_person'].push(std.student_id);
			 		state_count[key]['name'] = allstates[key];
			 		if(state_count[key]['count']>10){
			 			state_count[key]['fillKey'] = 'HIGH';
			 		}
			 	}
			 	else {
			 		state_count[key] = {};
			 		state_count[key]['count']=1;
			 		state_count[key]['list_person']=[];
			 		state_count[key]['list_person'].push(std.student_id);
			 		state_count[key]['name'] = allstates[key];
			 		state_count[key]['fillKey'] = 'MEDIUM';
			 	}
			 }
			}
			console.log('locationcount out');
			console.log(state_count);
			res.send(state_count);
		});
	
	

});

router.get('/map',isLoggedIn, function(req, res, next){
	res.render('map');
});

router.post('/sendmsg', function(req, res, next){
	console.log('saving msg, the req body is '+req.body);
	console.dir(req.body);
	console.dir(req.user);
	var msg_item = req.body.msg, receiver = req.body.receiver, sender = req.user.toObject().student_id;
	console.log('saving msg before create a temp');
	var newMsg= new Msg({
		'sender': sender,
		'msg': msg_item,
		'receiver': receiver,
		'time': new Date()
	});
	console.log('saving msg after create a temp');
	newMsg.save(function(err, newmsg) {
		if (err) return console.error(err);
		console.log("msg is saved");

		res.send('successful saved msg as '+ newmsg);

	});
})

module.exports = router;
