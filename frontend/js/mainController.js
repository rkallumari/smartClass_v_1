var app = angular.module('myApp', ["ngRoute", "chart.js"]);
app.controller('myCtrl', function($scope, $http, $location) {
  var authenticatedUser = {};
  var mcqAns = [];
  var createdQuestions = [];
  $scope.user = {};
  $scope.authenticated = false;
  $scope.submitted = false;
  $scope.updateMessage = undefined;
  $scope.optionsList  = undefined;
  $scope.quesType = undefined;
  $scope.questionQuiz = false;
  $scope.createQuestions = false;
  $scope.created = false;
  $scope.passwordMatch = true;
  $scope.adminAction = undefined;
  $scope.adminResult = undefined;
  $scope.admin = {};
  $scope.question = {};
  $scope.createdQuestions = [];
  $scope.loginResult =undefined;
  $scope.showQuestionsReport = false;
  $scope.showAttemptsReport = false;

  $scope.login = function() {
    var endpoint = 'http://localhost:3000/login?userId='+$scope.user.name+'&password='+$scope.user.password+'&userType='+$scope.user.type;
    makeGetCall(endpoint, function(response) {
      authenticatedUser = response.data;
      $scope.authenticated = true;
      if(response.data.userType === "student") {
        studentFlow();
      } else if(response.data.userType === "teacher") {
        teacherFlow();
      } else if(response.data.userType === "admin") {
        adminFlow();
      } else if(response.data.userType === "manager") {
        managerFlow();
      }
    }, function(response) {
      $scope.loginResult = response.data;
    });
  }

  $scope.getQuestions = function(type, desc) {
    var endpoint = 'http://localhost:3000/questions?type='+type;
    $scope.submitted = false;
    $scope.updateMessage = undefined;
    mcqAns = [];
    makeGetCall(endpoint, function(response) {
      console.log(response);
      $scope.questionType =  desc;
      $scope.questions = response.data;
    });
  }

  $scope.checkAnswers = function(questions) {
    var attempt = [];
    $scope.submitted = true;
    for(var i=0; i< questions.length; i++) {
      if(questions[i].type == 'SA') {
        if($('#qid_'+questions[i].qid).val().toLowerCase() === questions[i].ans.toLowerCase()) {
          $('#qid_correct_'+questions[i].qid).show();
          attempt.push({'qid': questions[i].qid, 'result': 'correct'});
        } else {
          $('#qid_wrong_'+questions[i].qid).show();
          attempt.push({'qid': questions[i].qid, 'result': 'wrong'});
        }
      } else if(questions[i].type == 'MCQ' || questions[i].type == 'YN') {
        mcqAns.forEach(mcq => {
          if(mcq.qid === questions[i].qid) {
            if(mcq.answer === questions[i].ans) {
              $('#qid_correct_'+questions[i].qid).show();
              attempt.push({'qid': questions[i].qid, 'result': 'correct'});
            } else {
              $('#qid_wrong_'+questions[i].qid).show();
              attempt.push({'qid': questions[i].qid, 'result': 'wrong'});
            }
          }
        });
      } else if(questions[i].type == 'LA') {
        $('#qid_correct_'+questions[i].qid).show();
        attempt.push({'qid': questions[i].qid, 'result': 'correct'});
      }
    }
    if(attempt.length > 0) {
      var formData = {'user':authenticatedUser, 'attempt':attempt};
      makePostCall("http://localhost:3000/updateAttempt", formData, function(result) {
        console.log("attempt updated");
        $scope.updateMessage = result.data;
      })
    }
  }

  $scope.refresh = function(questions) {
    $scope.questions = questions;
    $("p[id *= 'qid_correct']").hide();
    $("p[id *= 'qid_wrong']").hide();
    $scope.submitted = false;
    mcqAns = [];
  }

  $scope.answerChecked = function(qid, answer) {
    mcqAns.push({'qid':qid, 'answer' : answer});
  }

  $scope.constructOptions = function() {
    if($scope.question.options != undefined && $scope.question.options != "") {
      var options = $scope.question.options.split(",");
      $scope.optionsList  = [];
      var optionsList = [];
      var values = ['A', 'B', 'C', 'D'];
      for(var i=0; i<options.length; i++){
        optionsList.push({'key':options[i],'value': values[i]});
      }
      $scope.optionsList = optionsList;
    }
  }

  $scope.createQuestion = function() {
    if($scope.question != undefined && $scope.question.ques != undefined && $scope.question.ans != undefined) {
      var endPoint = 'http://localhost:3000/createQuestion';
      makePostCall(endPoint, {'question': $scope.question.ques, 'answer' : $scope.question.ans, 'type' :$scope.quesType.key,
      'typeDesc' : $scope.quesType.value, 'options' : $scope.optionsList }, function(response) {
        console.log("Questions created successfully!");
        createdQuestions.push({'ques' : $scope.question.ques, 'ans': $scope.question.ans, 'type': $scope.quesType.key, 'options' : $scope.optionsList});
        $scope.createdQuestions = createdQuestions;
        $scope.questionCreated = response.data;
        $scope.question.ques = undefined;
        $scope.question.ans = undefined;
        $scope.created = true;
      });
    }
  }

  $scope.logout = function() {
    $scope.createdQuestions = [];
    $scope.authenticated = false;
    $scope.questionQuiz = false;
    $scope.createQuestions = false;
    $scope.managerFlow = false;
    $scope.adminFlow = false;
    $scope.loginResult = undefined;
  }

  $scope.setQuestionType = function(key, value) {
    $scope.created = false;
    $scope.quesType = {'key': key, 'value': value};
  }

  $scope.chooseAction = function(action) {
    $scope.adminAction = action;
    $scope.adminResult = undefined;
  }

  $scope.confirmPassword = function() {
    if($scope.admin.user.password != $scope.admin.user.confirmpassword) {
      $scope.passwordMatch = false;
    } else {
      $scope.passwordMatch = true;
    }
  }

  $scope.createUser = function() {
    var endPoint = "http://localhost:3000/createUser";
    $scope.adminResult = undefined;
    var formData = {'userType': $scope.admin.user.type, 'userName': $scope.admin.user.name, 'password':$scope.admin.user.password, 'userId': $scope.admin.user.id,
  'email': $scope.admin.user.email};
    makePostCall(endPoint, formData, function(result) {
      $scope.adminResult = result.data;
      $('#adminRes').addClass('correct');
      $("#adminRes").removeClass('wrong');
    }, function(result) {
      $scope.adminResult = result.data;
      $("#adminRes").addClass('wrong');
      $("#adminRes").removeClass('correct');
    })
  }

  $scope.updateUser = function() {
    var endPoint = "http://localhost:3000/updateUser";
    $scope.adminResult = undefined;
    var formData = {'userType': $scope.admin.user.type, 'userId': $scope.admin.user.id, 'password':$scope.admin.user.password};
    makePostCall(endPoint, formData, function(result, status) {
      $scope.adminResult = result.data;
      $("#adminRes").addClass('correct');
      $("#adminRes").removeClass('wrong');
    }, function(result) {
      $scope.adminResult = result.data;
      $("#adminRes").addClass('wrong');
      $("#adminRes").removeClass('correct');
    })
  }

  $scope.questionsReport = function() {
    var endPoint = "http://localhost:3000/getQuestionDetails";
    $scope.showAttemptsReport = false;
    makeGetCall(endPoint, function(result) {
      var questions = result.data;
      var types = [];
      questions.forEach(element => {
        if(types.indexOf(element.typeDesc) == -1){
          types.push(element.typeDesc);
        }
      });
      var positiveAttempts = extractPositiveAttempts(types, questions);
      var negativeAttempts = extractNegativeAttempts(types, questions);
      $scope.labels = types;
      $scope.series = ['Correct', 'Wrong'];
      $scope.data = [
        positiveAttempts, negativeAttempts
      ];
      $scope.showQuestionsReport = true;
    })
  }

  $scope.attemptsReport = function() {
    $scope.showQuestionsReport = false;
    var endPoint = "http://localhost:3000/getQuestionDetails";
    $scope.labels = [ "Correct", "Wrong"];
    makeGetCall(endPoint, function(result) {
      var questions = result.data;
      var positiveAttempts = 0;
      var negativeAttempts = 1;
      questions.forEach(element => {
        positiveAttempts += element.correct;
        negativeAttempts += element.wrong;
      });
  
      $scope.labels = ['Correct', 'Wrong'];
      $scope.data = [positiveAttempts, negativeAttempts];
      $scope.showAttemptsReport = true;
    })
   
  }

  function extractPositiveAttempts(types, questions) {
    var positiveArray = [];
    types.forEach(element => {
      var count =0;
      questions.forEach(que => {
        if(que.typeDesc == element) {
          count += que.correct;
        }
      });
      positiveArray.push(count);
    });
    return positiveArray;
  }

  function extractNegativeAttempts(types, questions) {
    var negativeArray = [];
    types.forEach(element => {
      var count =0;
      questions.forEach(que => {
        if(que.typeDesc == element) {
          count += que.wrong;
        }
      });
      negativeArray.push(count);
    });
    return negativeArray;
  }

  function adminFlow() {
    $scope.adminFlow = true;
    
  }

  function studentFlow() {
    $scope.questionQuiz = true;
    $scope.questionTypes =[];
    var endpoint = 'http://localhost:3000/questionTypes';
    makeGetCall(endpoint, function(response) {
      $scope.questionTypes = response.data;
    });
  }

  function teacherFlow() {
    $scope.createQuestions = true;
    $scope.questionTypes =[];
    var endpoint = 'http://localhost:3000/questionTypes';
    makeGetCall(endpoint, function(response) {
      $scope.questionTypes = response.data;
    });
  }

  function managerFlow() {
    $scope.managerFlow = true;
  }

  function makeGetCall(endpoint, callback, errCallback) {
    $http({
      method: 'GET',
      url: endpoint
    }).then(function successCallback(response) {
        console.log(response);
        callback(response);
      }, function errorCallback(response) {
        console.log(response);
          if(errCallback != undefined) {
            errCallback(response);
          }
      });
  }

  function makePostCall(endpoint, formData, callback, errCallback) {
    $http({
      url: endpoint,
      method: "POST",
      data: formData
    })
    .then(function(response) {
      callback(response);
    }, 
    function(response) {
      console.log(response);
      if(errCallback != undefined) {
        errCallback(response);
      }
    });
  }
});