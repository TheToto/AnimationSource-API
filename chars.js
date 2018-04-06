const request = require('request');
const https = require("https");
const express = require('express');
const cheerio = require('cheerio');
const bodyParser = require("body-parser"); 

const com = require('./com');

module.exports.main = function (req, res, type) {
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
    //'cookie' : req.body.cookie
  }

  var deb;
  if (req.query.page && req.query.page > 1) {
    deb = (req.query.page-1) * 18;
  } else {
    deb = 0;
  }

  var options = {
    url: 'https://www.animationsource.org/' + req.params.sitename +'/'+ req.params.lang + '/chars/&deb='+deb,
    method: 'GET',
    encoding: 'binary',
    headers: headers,
    form: { }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      let reg = /\/([0-9]+).html/
      let data = [];
      let sel;
      
      if (req.params.lang == 'fr') 
        sels = ['#personnages_a_voir_absolument','#personnages_de_balto','#les_plus_recents'];
      else 
        sel = ['#must_see_chars'];
      
      for (sel in sels) { 
        let fetch = [];
        $(sels[sel]).find('img[height=50]').each(function(i, elem) {
          let title = $(this).attr('title');
          let img = $(this).attr('src');
          let id = reg.exec($(this).parent().attr('href'))[1];
          fetch[i] = {
            id: id,
            title: title,
            img: img,
          }
        });  
        console.log(sel);
        data.push(fetch);
      }

      res.json({
        res: data,
        options : options, 
        methode : req.method
      });
      console.log("ok");
    }
  });
}

module.exports.view = function (req, res, type) {
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
    //'cookie' : req.body.cookie
  }

  var options = {
    url: 'https://www.animationsource.org/' + req.params.sitename +'/'+ req.params.lang + '/chars/&numg='+ req.params.id,
    method: 'GET',
    encoding: 'binary',
    headers: headers,
    form: { }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);

      let desc = $('#description');
      let img = "https://www.animationsource.org/" + desc.find('img').first().attr('src');
      let name = desc.find('img').first().attr('title');
      let prof_sel;
      if (req.params.lang == 'fr') {
        prof_sel = "#profil";
      } else {
        prof_sel = "#profile";
      }
      let profil = $(prof_sel).children().first();

      let com_sel;
      if (req.params.lang == 'fr') {
        com_sel = '#derniers_commentaires';
      } else {
        com_sel = '#last_comments';
      }
      res.json({
        title: name,
        profile: profil.html(),
        desc: desc.html(),
        img: img,
        comment: com.getCom($,$(com_sel)),
        options : options, 
        methode : req.method
      });
      console.log("ok");
    } else { 
      res.json({
        options: options,
        error : "error request"
      });
    }
  });
}

module.exports.com = function (req, res, type) {
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
    //'cookie' : 'PHPSESSID=utbcfdvakjq4oua4c3pmk9ucf7'
  }

  var deb;
  if (req.query.page && req.query.page > 1) {
    deb = 10 + (req.query.page-2) * 30;
  } else {
    deb = 0;
  }
  let url;
  if (req.params.id) {
    url = 'https://www.animationsource.org/' + req.params.sitename +'/'+ req.params.lang + '/view_fan' + type + '/&numg='+ req.params.id + '&numart=' + req.params.idartist + '&deb_comm=' + deb;
  } else {
    url =  'https://www.animationsource.org/' + req.params.sitename +'/'+ req.params.lang + '/fan' + type + '/&numg=' + req.params.idartist + '&deb_comm=' + deb;
  }
  var options = {
    url: url,
    method: 'GET',
    encoding: 'binary',
    headers: headers
  }
  
  request(options, function (error, response, body) {


    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      //res.send(body);
      var main;
      let sel;
      if (deb == 0) {
        if (req.params.lang == 'en')
          sel = '#last_comments';
        else 
          sel = '#derniers_commentaires';
      } else {
        if (req.params.lang == 'en')
          sel = '#comments';
        else
          sel = '#commentaires';
      }
      res.json({
        main:  com.getCom($, $(sel)),
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

module.exports.sendcom = function (req, res, type) {

  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
    'cookie' : req.body.cookie
  }
  let url;
  if (req.params.id) {
    url = 'https://www.animationsource.org/' + req.params.sitename +'/'+ req.params.lang + '/view_fan' + type + '/&numg='+ req.params.id + '&numart=' + req.params.idartist;
  } else {
    url =  'https://www.animationsource.org/' + req.params.sitename +'/'+ req.params.lang + '/fan' + type + '/&numg=' + req.params.idartist;
  }
  var options = {
    url: url + '&dopost=1',
    method: 'POST',
    encoding: 'binary',
    headers: headers,
    form: {
      'comm': req.body.comm,
    }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      //res.send(body);
      res.json({
        confirm : true,
        options : options, 
        methode : req.method
      });
      console.log("ok");
    } else { 
      res.json({
        confirm: false,
        error : "error request"
      });
    }
  });
}
