const request = require('request');
const https = require("https");
const express = require('express');
const bodyParser = require("body-parser"); 
const firebase = require('firebase');

const Expo = require('expo-server-sdk');
let expo = new Expo();

var config = {
  apiKey: "AIzaSyAAUpwhjyLVNr4lfQ2ffi7treBKsApx7Fc",
  authDomain: "as-app-d9d7f.firebaseapp.com",
  databaseURL: "https://as-app-d9d7f.firebaseio.com",
  projectId: "as-app-d9d7f",
  storageBucket: "as-app-d9d7f.appspot.com",
  messagingSenderId: "625654127792"
};
firebase.initializeApp(config);

module.exports.register = function(req,res) {
  var reg = /\[([A-Za-z0-9-_]*)\]/;

  console.log(req.body);
  var postData = {};
  var id = reg.exec(req.body.token)[1];
  postData["token"] = req.body.token;
  console.log(reg.exec(req.body.token));
  var updates = {};
  updates['/users/' + id] = postData;
  firebase.database().ref().update(updates);
  res.send("Seems ok.");
}

module.exports.remove = function(req,res) {
  var reg = /\[([A-Za-z0-9-_]*)\]/;
  var id = reg.exec(req.body.token)[1];
  var toDelete = firebase.database().ref().child('users').child(id);
  toDelete.remove();
}

module.exports.sendAll = function(req,res) {
  firebase.database().ref('users/').on('value', (snapshot) => {
    const users = snapshot.val();

    let query = [];
    for (var p in users) {
      if( users.hasOwnProperty(p) ) {
        query.push({
          'to': users[p].token,
          'title': req.body.title,
          'body': req.body.body
        });
        
      } 
    }         
    console.log(query);
    let chunks = expo.chunkPushNotifications(query);
    (async () => {
      for (let chunk of chunks) {
        try {
          let receipts = await expo.sendPushNotificationsAsync(chunk);
          res.send(receipts);
        } catch (error) {
          res.send(error);
        }
      }
    })();   
    
  });
}