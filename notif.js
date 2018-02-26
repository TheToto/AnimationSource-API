const request = require('request');
const https = require("https");
const express = require('express');
const cheerio = require('cheerio');
const bodyParser = require("body-parser"); 

const Expo = require('expo-server-sdk');
let expo = new Expo();

var firebase = require('firebase-admin');

firebase.initializeApp({
  credential: firebase.credential.cert(JSON.parse(process.env.firebase_admin)),
  databaseURL: 'https://as-app-d9d7f.firebaseio.com'
});


module.exports.getNew = function(req,res) {
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
    'cookie' : req.body.cookie
  }
  let url = "https://www.animationsource.org/engine/ajax/ajax_php_function_call.php";
  var options = {
    url: url,
    method: 'POST',
    encoding: 'binary',
    headers: headers,
    form: {
      script_name: "func_support",
      php_function_name: "ajaxNotifDisplay",
      sitename: "hub",
      lang:1
    }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      let notifs = [];
      var reg = /&numg=([0-9]+)/
      $('.trnotif').each(function(i,e) {
        let avatar = $(this).find('.tdavatar');
        let id = reg.exec(avatar.find('a').attr('href'))[1];
        let img = avatar.find('img').attr('src');
        let mess = $(this).find('.tdmessage');
        let content = mess.find('div');
        content.find('br').replaceWith(' ');

        notifs[i] = {
          avatar:img,
          id: id,
          url: mess.find('a').attr('href'),
          content: content.text(),
        }
      });

      res.json({
        notifs: notifs,
      });
      console.log("ok");
    } else { 
      res.json({
        error : "error request"
      });
    }
  });
}

module.exports.getOld = function(req,res) {
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
    'cookie' : req.body.cookie
  }

  var deb;
  if (req.query.page && req.query.page > 1) {
    deb = (req.query.page-1) * 20;
  } else {
    deb = 0;
  }

  let url = "https://www.animationsource.org/hub/fr/notifs/&deb=" + deb;
  var options = {
    url: url,
    method: 'GET',
    encoding: 'binary',
    headers: headers,
    form: {
    }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      let notifs = [];
      var reg = /&numg=([0-9]+)/
      $('.trnotif').each(function(i,e) {
        let avatar = $(this).find('.tdavatar');
        let id = reg.exec(avatar.find('a').attr('href'))[1];
        let img = avatar.find('img').attr('src');
        let mess = $(this).find('.tdmessage');
        let content = mess.find('div');
        content.find('br').replaceWith(' ');

        notifs[i] = {
          avatar:img,
          id: id,
          url: mess.find('a').attr('href'),
          content: content.text(),
        }
      });

      res.json({
        notifs: notifs,
      });
      console.log("ok");
    } else { 
      res.json({
        error : "error request"
      });
    }
  });
}

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