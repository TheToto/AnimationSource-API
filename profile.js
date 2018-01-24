const request = require('request');
const https = require("https");
const express = require('express');
const cheerio = require('cheerio');
const bodyParser = require("body-parser"); 

const com = require('./com');

module.exports.getAsProfile = function (req, res) {
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
    //'cookie' : 'PHPSESSID=utbcfdvakjq4oua4c3pmk9ucf7'
  }

  var options = {
    url: 'https://www.animationsource.org/hub/en/profile/&fullprofile=1&numg='+req.params.id,
    method: 'GET',
    encoding: 'binary',
    headers: headers
  }
  
  request(options, function (error, response, body) {


    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      //res.send(body);
      var reg = /.org\/hub\/(fr|en)\/profile\/([^\/]+)\/(\d+)/
      var canon = reg.exec($('link[rel=canonical]').attr('href'));
      
      reg = /&u=([0-9]+)/
      var forumid = reg.exec($('#viewforumprofile').attr('href'))[1];

      var av = $('.bcentre big b');
      var pseudo = av.text().slice(1);
      var avatar = av.parent().prev().attr('src');

      var main = {};
      $('#main_information table tbody tr').each(function(i, elem) {
        if ($(this).children().length == 3) {
          var pos = $(this).children().first().text().replace(/(\s|:)/g, "");
          switch(pos) {
            case "Country":
            case "Gender":
              main[pos] = $(this).children().last().find('img').attr('title');
              break;
            case "Membersince":
              main[pos] = new Date($(this).children().last().text()).getTime() / 1000;
              break;
            case "Age":
              reg = /\((.+)\)/g
              try {
              main[pos] = new Date(reg.exec($(this).children().last().text())[1]).getTime() / 1000;
              }
              catch (e) { console.log('Date not show'); }
              break;
            default:
              main[pos] = $(this).children().last().text();
          }
        }
      });
      try {
        var desc = $('table.bs2 div[style^=padding]').html();
        const $2 = cheerio.load(desc);
        $2('img').each(function(i, elem) {
          if ($2(this).attr('src').startsWith('/')) {
            $2(this).attr('src', "https://www.animationsource.org" + $2(this).attr('src'));
          }
        });
        var desc = $2.html();
      } catch (e) { console.log('No desc...'); var desc = "No description" }


      res.json({
        id: canon[3],
        url: "https://www.animationsource.org/hub/en/profile/&numg="+req.params.id,
        infos: {
          lang: canon[1],
          pseudo: pseudo,
          avatar: avatar,
          forumid: forumid,
          online: $('.bcentre img[title=online]').length == 1,
          main: main,
          desc: desc
        },
        comments: com.getCom($, $('#last_comments')),
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



module.exports.getCommentProfile = function (req, res) {
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
    //'cookie' : 'PHPSESSID=utbcfdvakjq4oua4c3pmk9ucf7'
  }

  var deb;
  if (req.query.page && req.query.page > 1) {
    deb = 5 + (req.query.page-2) * 30;
  } else {
    deb = 0;
  }

  var options = {
    url: 'https://www.animationsource.org/hub/en/profile/&fullprofile=0&numg='+req.params.id+'&deb_comm=' + deb,
    method: 'GET',
    encoding: 'binary',
    headers: headers
  }
  
  request(options, function (error, response, body) {


    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      //res.send(body);
      var main;
      if (deb == 0) {
        main = com.getCom($, $('#last_comments'));
      } else {
        main = com.getCom($, $('#comments'));
      }
      res.json({
        url: "https://www.animationsource.org/hub/en/profile/&numg="+req.params.id,
        main: main,
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

module.exports.sendCommentProfile = function (req, res) {

  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
    'cookie' : req.body.cookie
  }

  var options = {
    url: 'https://www.animationsource.org/start.php?sitename=hub&langname=fr&act=profile&numg=' + req.params.id + '&dopost=1',
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