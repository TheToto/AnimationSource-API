const request = require('request');
const https = require("https");
const express = require('express');
const cheerio = require('cheerio');
const bodyParser = require("body-parser"); 
const { Client } = require('pg');
const jsonfile = require('jsonfile');

const com = require('./com');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();

module.exports.get = function(req,res) {
  let nb = 15;
  let page = req.query.page;
  if (req.query.page == undefined) {
    page = 1;
  }
  let offset = (page-1)*nb;

  const sql = 'SELECT id,sitename,date,title,img,author FROM news ORDER BY id DESC LIMIT ' + nb + ' OFFSET ' + offset +';';
  console.log(sql);
  client.query(sql, (err, resu) => {
    if (err) {
      res.json({
        status : "error",
        error: err
      });
      return;
    }
    res.json({
      status : "ok",
      news: resu.rows
    });
  });
}

module.exports.one = function(req,res) {

  const sql = 'SELECT * FROM news WHERE id=' + req.params.id +';';
  console.log(sql);
  client.query(sql, (err, resu) => {
    if (err) {
      res.json({
        status : "error",
        error: err
      });
      return;
    }
    const $2 = cheerio.load(resu.rows[0].content);
    $2('img').each(function(i, elem) {
      if ($2(this).attr('src').startsWith('/')) {
        $2(this).attr('src', "https://www.animationsource.org" + $2(this).attr('src'));
      }
    });
    resu.rows[0].content = $2.html();
    res.json({
      status : "ok",
      news: resu.rows[0]
    });
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
  url = 'https://www.animationsource.org/petit_poney/fr/comments/' + '/&numg='+ req.params.id;
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
  url = 'https://www.animationsource.org/petit_poney/fr/comments/' + '/&numg='+ req.params.id;
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