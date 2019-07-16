/**
 * @author Rajesh Kallumari
 * @email rkallumari@gmail.com
 * This fie is the angular js controller and contains all the calls from server and logic on
 * displaying data in the frontend
 */

var app = angular.module('myApp', ["ngRoute", "chart.js"]);
app.controller('myCtrl', function($scope, $http, $location) {

 /**
  * Declaring all the local variables and angular scope variables.
  */

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
  $scope.studentList = [];
  $scope.checkedStudent = undefined;

  /** Change the backend endpoint in this variable for various environments */
  var endpoint = "http://localhost:3000/";

  /**
   *  Function that carries out the authentication of the user
   */
  $scope.login = function() {
    var url = endpoint + 'login?userId='+$scope.user.name+'&password='+$scope.user.password+'&userType='+$scope.user.type;
    makeGetCall(url, function(response) {
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

  /**
   * Function that fetches questions of a given type
   * 
   * type : The type of question chosen by the student
   * desc : The description of the type of the question
   */
  $scope.getQuestions = function(type, desc) {
    var url = endpoint + 'questions?type='+type;
    $scope.submitted = false;
    $scope.updateMessage = undefined;
    mcqAns = [];
    makeGetCall(url, function(response) {
      console.log(response);
      $scope.questionType =  desc;
      $scope.questions = response.data;
    });
  }

  /**
   * Fucntion to check the answers and update the attempts 
   * 
   * questions : the list of questions that are answered
   */
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
      makePostCall(endpoint + "updateAttempt", formData, function(result) {
        console.log("attempt updated");
        $scope.updateMessage = result.data;
      })
    }
  }

  /**
   * Function to refresh the questions once the answers are checked
   * 
   * questions : set of questions shown on the screen
   */
  $scope.refresh = function(questions) {
    $scope.questions = questions;
    $("p[id *= 'qid_correct']").hide();
    $("p[id *= 'qid_wrong']").hide();
    $scope.submitted = false;
    mcqAns = [];
  }

  /**
   * Function to update the options chosen by student for mcq and yn questions
   * 
   * qid : question id
   * answer : answer chosen
   */
  $scope.answerChecked = function(qid, answer) {
    var updated = false;
    mcqAns.forEach(element => {
      if(element.qid == qid) {
        element.answer = answer;
        updated = true;
      }
    });
    if(!updated) {
      mcqAns.push({'qid':qid, 'answer' : answer});
    }
  }


  /**
   * Function to construct the MCQ question options for teachers
   */
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

  /**
   * Function to create questions for teachers
   */
  $scope.createQuestion = function() {
    if($scope.question != undefined && $scope.question.ques != undefined && $scope.question.ans != undefined) {
      var url = endpoint + 'createQuestion';
      makePostCall(url, {'question': $scope.question.ques, 'answer' : $scope.question.ans, 'type' :$scope.quesType.key,
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

  /**
   * Function to logout a user
   */
  $scope.logout = function() {
    $scope.createdQuestions = [];
    $scope.authenticated = false;
    $scope.questionQuiz = false;
    $scope.createQuestions = false;
    $scope.managerFlow = false;
    $scope.adminFlow = false;
    $scope.loginResult = undefined;
  }

  /**
   * Function to set the question type to be created for the teachers
   * 
   * Key:The keys like MCQ, SA for the questions
   * Value: The description of the question types
   */
  $scope.setQuestionType = function(key, value) {
    $scope.created = false;
    $scope.quesType = {'key': key, 'value': value};
  }

  /**
   * Function to chose action admin likes to perform
   * 
   * action: Theactions like create user/ update password for the admin
   */
  $scope.chooseAction = function(action) {
    $scope.adminAction = action;
    $scope.adminResult = undefined;
  }

  /**
   * Function to check if password retyped matches the initial password
   */
  $scope.confirmPassword = function() {
    if($scope.admin.user.password != $scope.admin.user.confirmpassword) {
      $scope.passwordMatch = false;
    } else {
      $scope.passwordMatch = true;
    }
  }

  /**
   * Function to create user for admin
   */
  $scope.createUser = function() {
    var url = endpoint+"createUser";
    $scope.adminResult = undefined;
    var formData = {'userType': $scope.admin.user.type, 'userName': $scope.admin.user.name, 'password':$scope.admin.user.password, 'userId': $scope.admin.user.id,
  'email': $scope.admin.user.email};
    makePostCall(url, formData, function(result) {
      $scope.adminResult = result.data;
      $('#adminRes').addClass('correct');
      $("#adminRes").removeClass('wrong');
    }, function(result) {
      $scope.adminResult = result.data;
      $("#adminRes").addClass('wrong');
      $("#adminRes").removeClass('correct');
    })
  }

  /**
   * Function to update the user password by the admin
   */
  $scope.updateUser = function() {
    var url = endpoint+"updateUser";
    $scope.adminResult = undefined;
    var formData = {'userType': $scope.admin.user.type, 'userId': $scope.admin.user.id, 'password':$scope.admin.user.password};
    makePostCall(url, formData, function(result, status) {
      $scope.adminResult = result.data;
      $("#adminRes").addClass('correct');
      $("#adminRes").removeClass('wrong');
    }, function(result) {
      $scope.adminResult = result.data;
      $("#adminRes").addClass('wrong');
      $("#adminRes").removeClass('correct');
    })
  }

  /**
   * Function to fetch the questions report for manager
   */
  $scope.questionsReport = function() {
    var url = endpoint + "getQuestionDetails";
    $scope.showAttemptsReport = false;
    $scope.showStudentReport = false;
    makeGetCall(url, function(result) {
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

  /**
   * Function to fetch the attempts report for the manager
   */
  $scope.attemptsReport = function() {
    $scope.showQuestionsReport = false;
    $scope.showStudentReport = false;
    var url = endpoint + "getQuestionDetails";
    makeGetCall(url, function(result) {
      var questions = result.data;
      var positiveAttempts = 0;
      var negativeAttempts = 0;
      questions.forEach(element => {
        positiveAttempts += element.correct;
        negativeAttempts += element.wrong;
      });
  
      $scope.labels = ['Correct', 'Wrong'];
      $scope.data = [positiveAttempts, negativeAttempts];
      $scope.showAttemptsReport = true;
    })
  }

  /**
   * Function to fetch the list of students for the manager
   */
  $scope.studentReport = function() {
    var url = endpoint + "getStudents";
    $scope.showStudentReport = true;
    $scope.showQuestionsReport = false;
    $scope.showAttemptsReport = false;
    makeGetCall(url, function(result){
      $scope.studentList = result.data; 
    })  
  }

  /**
   * Function to fetch the report for the selected student
   */
  $scope.studentChecked = function(student){
    var attempts = student.questionsAttempted;
    var positiveAttempts = 0;
    var negativeAttempts =0;
    $scope.checkedStudent = student.userName;
    attempts.forEach(element => {
      positiveAttempts += element.correct;
      negativeAttempts += element.wrong;
    });
    $scope.labelsStudent = ['Correct', 'Wrong'];
    $scope.dataStudent = [positiveAttempts, negativeAttempts];
    $('#pieStudent').show();
  }

  /**
   * Function to extract the number of positive attempts in a particular type of question
   * @param {*} types  : List of all types of questions available
   * @param {*} questions : List of all questions
   */
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

  /**
   * Function to extract the number of positive attempts in a particular type of question
   * @param {*} types  : List of all types of questions available
   * @param {*} questions : List of all questions
   */
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

  /**
   * Function for navigating to the admin flow
   */
  function adminFlow() {
    $scope.adminFlow = true;
    
  }

  /**
   * Function for navigating to the student flow
   */
  function studentFlow() {
    $scope.questionQuiz = true;
    $scope.questionTypes =[];
    var uri = endpoint + 'questionTypes';
    makeGetCall(uri, function(response) {
      $scope.questionTypes = response.data;
    });
  }

  /**
   * Function for navigating to the teacher flow
   */
  function teacherFlow() {
    $scope.createQuestions = true;
    $scope.questionTypes =[];
    var uri = endpoint + 'completeQuestionTypes';
    makeGetCall(uri, function(response) {
      $scope.questionTypes = response.data;
    });
  }

  /**
   * Function for navigating to the manager flow
   */
  function managerFlow() {
    $scope.managerFlow = true;
  }

  /**
   * Makes a get call to the given endpoint
   * 
   * @param {*} endpoint : The endpoint to which the get call needs to be made
   * @param {*} callback : The callback function to be called on success of the ajax call
   * @param {*} errCallback : The callback function to be called on error of the ajax call 
   */
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

  /**
   * Makes a get call to the given endpoint
   * 
   * @param {*} endpoint : The endpoint to which the get call needs to be made
   * @param {*} formData : The form data to be sent in the post call
   * @param {*} callback : The success callback function
   * @param {*} errCallback : The error call back function
   */
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