const request = require('request');
const https = require("https");
const express = require('express');
const cheerio = require('cheerio');
const bodyParser = require("body-parser"); 

module.exports.connect = function (req, res) {
  var j = request.jar();
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
    //'cookie' : 'PHPSESSID=utbcfdvakjq4oua4c3pmk9ucf7'
  }

  var options = {
    jar: j,
    url: 'https://www.animationsource.org/hub/en/profile/&login=1',
    method: 'POST',
    encoding: 'binary',
    headers: headers,
    form: {'theusername':req.body.user,
            'thepassword':req.body.pass,
            'autologin':'on'
        }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      let success = false;
      let infos = {}
      var reg = /&numg=([0-9]+)/
      if ($('.emsg').length == 0) {
        success = true;
        infos = {
          avatar: $('#avatar').val(),
          pseudo:  $('.bcentre big b').text().slice(1),
          id: reg.exec($('#previewprofile').attr('href'))[1]
        }
      }


      res.json({
        success: success,
        infos: infos,
        cookie: j.getCookieString("https://www.animationsource.org/hub/en/news/&login=1").split(';')[0], // Ugly : return PHPSESSID
        options : options, 
        methode : req.method
      });
      console.log("ok");
    } else { 
      res.json({
        error : "error request"
      });
    }
  });
}

module.exports.testConnect = function (req, res) {

  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
    'cookie' : req.body.cookie
  }

  var options = {
    url: 'https://www.animationsource.org/hub/fr/profile/',
    method: 'POST',
    encoding: 'binary',
    headers: headers,
    form: {
      
    }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      let success = false;
      let infos = {}
      var reg = /&numg=([0-9]+)/
      if ($('.emsg').length == 0) {
        success = true;
        infos = {
          avatar: $('#avatar').val(),
          pseudo:  $('.bcentre big b').text().slice(1),
          id: reg.exec($('#previewprofile').attr('href'))[1]
        }
      }


      res.json({
        success: success,
        infos: infos,
        options : options, 
        methode : req.method
      });
      console.log("ok");
    } else { 
      res.json({
        error : "error request"
      });
    }
  });
}