const express = require('express');
const app = express();
var cors = require('cors');
var dbCalls =require('./db');
const nodemailer = require("nodemailer");

app.use(cors());

var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'rkallumari@gmail.com',
    pass: 'JKHPRowling@7'
  }
});
 
app.get('/login', function (req, res) {
  authenticate(req.query.userId, req.query.password, req.query.userType, res);
});

app.get('/questions', function (req, res) {
  getQuestions(req.query.type, res);
});

app.get('/questionTypes', function (req, res) {
  getQuestionTypes(res);
});

app.post('/updateAttempt', function (req, res) {
  var user = req.body.user;
  var attempts = req.body.attempt;
  attempts.forEach(attempt => {
    updateAttempt(attempt);
  });
  res.send("We are updating your attempt! Check your answers");
});

app.post('/createQuestion', function (req, res) {
  var question = req.body.question;
  var answer = req.body.answer;
  dbCalls.getMaxQId('questions','qid', function(result) {
    if(req.body.type == 'MCQ') {
      var newQuestion = [{
        'ans' : answer,
        'attempts': 0,
        'correct': 0,
        'wrong': 0,
        'qid': result+1,
        'type': req.body.type,
        'typeDesc': req.body.typeDesc,
        'ques': question,
        'options': req.body.options
      }];
    } else {
      var newQuestion = [{
        'ans' : answer,
        'attempts': 0,
        'correct': 0,
        'wrong': 0,
        'qid': result+1,
        'type': req.body.type,
        'typeDesc': req.body.typeDesc,
        'ques': question,
      }];
    }
    console.log(newQuestion[0].qid);
    dbCalls.insertDocs('questions', newQuestion, function(response) {
      res.send("Created the question successfuly");
    })
  })
});

app.post('/createUser', function(req, res) {
  var user = [{
    'userId' : req.body.userId,
    'userName' : req.body.userName,
    'password' : req.body.password,
    'userType' : req.body.userType,
    'emailId' : req.body.email,
    'emailConfirmed' : false
  }];
  dbCalls.readFromDb('Login', {'userId' : req.body.userId}, function(userResults) {
    if(userResults.length >0) {
      res.status(401).send("Sorry! User with Id '"+ req.body.userId +"' already exists");
    } else {
      dbCalls.insertDocs('Login', user, function(result) {
        res.send("User with Id '" + req.body.userId  +"' successfuly created");
        var emailContent = "Hi "+req.body.userName+",\n Complete your login b clicking on link http://localhost:3000/confirmUser?userId="+req.body.userId+".\n Post that you can login using the creds. \nUserId: "+req.body.userId+"\nPassword: "+req.body.password;
        var mailOptions = {
          from: 'rkallumari@gmail.com',
          to: req.body.email,
          subject: 'Complete the Smart Class Registration!',
          text: emailContent
        };
        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
      });
     
    }
    });
});

app.get('/confirmUser', function(req, res){
  dbCalls.updateDoc('Login', {'userId': req.query.userId}, {'emailConfirmed' : true}, function(response) {
    res.sendfile("verification.html");
  })
}) 

app.post('/updateUser', function(req, res) {
  dbCalls.readFromDb('Login', {'userId' : req.body.userId, 'userType': req.body.userType}, function(user) {
    if(user.length >0) {
      dbCalls.updateDoc('Login', {'userId':req.body.userId}, {'password': req.body.password}, function(result){
        res.send('Password of User with Id '+ req.body.userId + ' has been updated successfuly');
      });
    } else {
      res.status(404).send("Sorry! User with Id '"+ req.body.userId + "' doesn\'t exist");
    }
  });
});

app.get('/getQuestionDetails', function(req, res) {
  dbCalls.readFromDb('questions', {}, function(result) {
    res.send(result);
  })
})

function updateAttempt(attempt) {
  dbCalls.readFromDb('questions', {'qid' : attempt.qid}, function(ques) {
    var attm = ques[0].attempts +1;
    var correct = ques[0].correct;
    var wrong = ques[0].wrong;
    if(attempt.result === 'correct') {
      correct += 1;
    } else {
      wrong += 1;
    }
    dbCalls.updateDoc('questions', {'qid':ques[0].qid}, {'attempts':attm, 'correct' : correct, 'wrong' : wrong}, function(result){
      console.log("Updated qid :"+ ques[0].qid);
    });
  })
}

function authenticate(userId, password, userType, res) {
  dbCalls.readFromDb('Login', {'userId': userId, 'userType': userType}, function(creds) {
    if(creds != undefined && creds.length > 0) {
      if(creds[0].userId == userId && creds[0].password == password) {
        res.send({'userName': creds[0].userName, 'LoginStatus': 'Successful', 'userType' : creds[0].userType});
      } else {
        res.status(401).send('Check your password');
      }
    } else {
      res.status(404).send('Account doesn\'t exist. Please contact admin.');
    }
  })
}

function getQuestions(type, res) {
  dbCalls.readFromDb('questions',{'type':type}, function(questions) {
    res.send(questions);
  })
}
 function getQuestionTypes(res) {
  dbCalls.readFromDb('questions',{}, function(questions) {
    var types = [];
    questions.forEach(ques => {
      if(!checkForDuplicate(types, ques)) {
        types.push({'key':ques.type,'value':ques.typeDesc});
      }
    });
    res.send(types);
  })
 }

 function checkForDuplicate(types, ques) {
    for(var i=0; i< types.length; i++) {
      if(types[i].key === ques.type) {
        return true;
      }
    }
    return false;
 }
 
app.listen(3000, function(){
  console.log("Server started on "+3000);
});
