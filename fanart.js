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
    url: 'https://www.animationsource.org/' + req.params.sitename +'/'+ req.params.lang + '/fan' + type + '/&deb_gall='+deb,
    method: 'GET',
    encoding: 'binary',
    headers: headers,
    form: { }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      let reg = /\/([0-9]+).html&numart=([0-9]+)/
      let must_see =[];
      let sel;
      if (req.params.lang == 'fr') {
        if (type == 'art')
          sel = '#dessins_a_voir_absolument';
        else 
          sel = '#images_a_voir_absolument';
      } else {
        if (type == 'art')
          sel = '#must_see_drawings';
        else
          sel = '#must_see_images';
      }
      $(sel).find('td[align=center]').each(function(i, elem) {
        let tmp = $(this).children().first();
        let author = tmp.children().first().text();
        tmp = tmp.next();
        let regres = reg.exec(tmp.attr('href'));
        let id = regres[1];
        let authorid = regres[2];
        let img = tmp.find('img').attr('src');
        tmp = tmp.next();
        let title = tmp.text();
        must_see[i] = {
          id: id,
          title: title,
          img: img,
          authorid: authorid,
          author: author
        }
      });

      reg = /\/([0-9]+).html/
      let artists = [];
      if (req.params.lang == 'fr') {
        sel = '#galeries_d_artistes';
      } else {
        sel = '#artists_galleries';
      }
      $(sel).children().first().children().each(function(i, elem) {
        let authorid = reg.exec($(this).attr('href'))[1];
        let img = $(this).children().first();
        let author = img.attr('title');
        img = img.attr('src');
        artists[i] = {
          author: author,
          authorid: authorid,
          img: img
        }
      });
  

      res.json({
        must_see: must_see,
        artists: artists,
        count: artists.length,
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

module.exports.artist = function (req, res, type) {
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
    url: 'https://www.animationsource.org/' + req.params.sitename +'/'+ req.params.lang + '/fan' + type + '/&numg=' + req.params.idartist + '&deb='+deb,
    method: 'GET',
    encoding: 'binary',
    headers: headers,
    form: { }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      let reg = /\/([0-9]+).html&numart=([0-9]+)/
      let imgs =[];
      let sel = "div[id$=global] div[id*=_20] > table";
      $(sel).each(function(i,elem) {
        let img = $(this).find('img[src*=fan' + type + ']');
        let name = img.attr('title');
        let regres = reg.exec(img.parent().attr('href'));
        let id = regres[1];
        let authorid = regres[2];
        imgs[i] = {
          name: name,
          id: id,
          authorid: authorid,
          img: img.attr('src')
        }
      });
      let com_sel;
      if (req.params.lang == 'fr') {
        com_sel = '#derniers_commentaires';
      } else {
        com_sel = '#last_comments';
      }
      res.json({
        imgs: imgs,
        comment: com.getCom($,$(com_sel)),
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

module.exports.view = function (req, res, type) {
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
    //'cookie' : req.body.cookie
  }

  var options = {
    url: 'https://www.animationsource.org/' + req.params.sitename +'/'+ req.params.lang + '/view_fan' + type + '/&numg='+ req.params.id + '&numart=' + req.params.idartist,
    method: 'GET',
    encoding: 'binary',
    headers: headers,
    form: { }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);

      let img = $('body > div >img');
      let title = img.attr('title');
      let desc = $('.descr').text();
      let sel = "div[id$=global] div[id*=_20] > table";

      let com_sel;
      if (req.params.lang == 'fr') {
        com_sel = '#derniers_commentaires';
      } else {
        com_sel = '#last_comments';
      }
      res.json({
        title: title,
        desc: desc,
        img: img.attr('src'),
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