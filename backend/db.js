/**
 * This file contains all the functions required to communicate with the db
 * @author Rajesh Kallumari
 * @mail rkallumari@gmail.com
 */

const MongoClient = require('mongodb').MongoClient;
 
// Connection URL
const url = 'mongodb://localhost:27017';
 
// Database Name
const dbName = 'local';

/**
 * Function to read from the db
 * @param {*} collectionName : The collection on which the query needs to be run
 * @param {*} query : The query to be run on the collection
 * @param {*} callback : The callback to be called on successful execution of the query
 */
function readFromDb(collectionName, query, callback) {
  // Use connect method to connect to the server
  MongoClient.connect(url, function(err, client) {
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    console.log(query);
    collection.find(query).toArray(function(err, docs) {
      console.log("Found the following records");
      console.log(docs);
      callback(docs);
    });
    client.close();
  });
}

/**
 * Function to update the data in db
 * @param {*} collectionName : The collection on which the update needs to be run
 * @param {*} query : The query to be run on the collection
 * @param {*} update : Data to be updated in teh collection
 * @param {*} callback : The callback to be called on successful update of the query
 */
function updateDoc(collectionName, query, update, callback) {
   // Use connect method to connect to the server
   MongoClient.connect(url, function(err, client) {
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    console.log(query);
    collection.updateOne(query, { $set: update }, function(err, result) {
      console.log("Updated the document with the field "+query+ ".Updated with "+update);
      callback(result);
    });
    client.close();
  });
}

/**
 * Function to insert data into the db
 * @param {*} collectionName : The collection in which data needs to be inserted
 * @param {*} data : The data to be inserted
 * @param {*} callback : The callback to be called on successful insertion of the data
 */
function insertDocs(collectionName, data, callback) {
  // Use connect method to connect to the server
  MongoClient.connect(url, function(err, client) {
   console.log("Connected successfully to server");
   const db = client.db(dbName);
   const collection = db.collection(collectionName);
   collection.insertMany(data, function(err, result) {
      console.log(result);
      console.log(err);
      callback(result);
    });
   client.close();
 });
}

/**
 * Function to delete data in the db
 * @param {*} collectionName : The collection in which data needs to be deleted
 * @param {*} query : The query to be run on the collection 
 * @param {*} callback : The callback to be called on successful deletion of the data
 */
function deleteDocs(collectionName, query, callback) {
  // Use connect method to connect to the server
  MongoClient.connect(url, function(err, client) {
   console.log("Connected successfully to server");
   const db = client.db(dbName);
   const collection = db.collection(collectionName);
   collection.deleteOne(query, function(err, result) {
      console.log("Removed the document with the field "+query);
      callback(result);
    });
   client.close();
 });
}

/**
 * Function to get the max ID for a collection in db
 * @param {*} collectionName : The collection for which max Id needs to be acquired
 * @param {*} field : The field that has been designed as the unique integer ID for the collection
 * @param {*} callback : The callback function to be called after aquiring the maximum id
 */
function getMaxQId(collectionName, field, callback) {
  readFromDb(collectionName, {}, function(result){
    var maxId = 0;
    result.forEach(element => {
      if(element[field] > maxId) {
        maxId = element[field];
      }
    });
    callback(maxId);
  })
}

/**
 * Exporting all the functions to be used in index.js
 */
module.exports = {
  readFromDb: readFromDb,
  updateDoc: updateDoc,
  insertDocs: insertDocs,
  deleteDocs: deleteDocs,
  getMaxQId: getMaxQId
}