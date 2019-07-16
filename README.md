# smartClass_v_1
A smart digital classroom application

Functionalities:
Login: Can be logged in as admin, manager, student and teacher.
Admin: Can create a user and also update password of a given user.
Student: Can choose the type  of the question he wants to answer and see the correctness of his answers.
Manager: Can see reports pertained to questions, attempts and aso individual student attempts.
Teacher: Can create questions of various types and also view the questions created in a given session.

Technical:

Frontend:
Written in Angular JS and JQuery. Used bootstrap for general stylings and defined some custom styles.
mainController.js, index.html and main.css
Use cordova to build the apps specific to android and ios
Change the backend endpoint in the mainController.js for different environments.

Backend:
Written in NodeJs, Express and used Mongo DB for storing the data.
index.js, db.js and verification.html
Run the node server on a particular port and this endpoint needs to be updated in the frontend file.
Run the mongo as well on a server and update the mongo endpoint and credentials in the db.js
