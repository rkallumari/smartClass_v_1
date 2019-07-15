const MongoClient = require('mongodb').MongoClient;
 
// Connection URL
const url = 'mongodb://localhost:27017';
 
// Database Name
const dbName = 'local';

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

module.exports = {
  readFromDb: readFromDb,
  updateDoc: updateDoc,
  insertDocs: insertDocs,
  deleteDocs: deleteDocs,
  getMaxQId: getMaxQId
}