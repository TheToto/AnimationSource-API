const request = require('request');
const https = require("https");
const express = require('express');
const cheerio = require('cheerio');
const bodyParser = require("body-parser"); 

module.exports.getMp = function (req, res) {
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
    'cookie' : req.body.cookie
  }

  var options = {
    url: 'https://www.animationsource.org/hub/en/readmp/',
    method: 'GET',
    encoding: 'binary',
    headers: headers,
    form: { }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
  
      let result =[];
      $('form .bs2 tbody').children().each(function(i, elem) {
        let temp = $(this).children().first();
        let m_id = temp.children().first().val();
        temp = temp.next().next();
        let m_text = temp.find('span').text();
        temp = temp.next();
        let m_from = temp.text();
        temp = temp.next();
        let m_date = temp.find('span').text();
        result[i] = {
          id: m_id,
          title: m_text,
          from: m_from,
          date: m_date
        }
      });
      result.shift();
      result.pop();
      result.pop();
  

      res.json({
        count: result.length,
        mps: result,
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

module.exports.send = function (req, res) {

  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
    'cookie' : req.body.cookie
  }
  var options = {
    url: 'https://www.animationsource.org/hub/en/sendmp/&to=' + req.params.id,
    method: 'GET',
    encoding: 'binary',
    headers: headers,
    form: {
    }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      let infos = {
        from: $('form[name=form1] > input[name=from]').val(),
        from_id: $('form[name=form1] > input[name=from_id]').val(),
        fromuser: $('form[name=form1] > input[name=fromuser]').val(),
        to: $('form[name=form1] > input[name=to]').val(),
        lang1: $('form[name=form1] > input[name=lang1]').val(),
        lang2: $('form[name=form1] > input[name=lang2]').val(),
        sujet: req.body.sujet,
        msg: req.body.msg
      }

      reallysend(infos, req, res);

      console.log(infos);
    } else { 
      res.json({
        confirm: false,
        error : "error request"
      });
    }
  });
}

function reallysend(infos, req, res) {

  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
    'cookie' : req.body.cookie
  }
  var options = {
    url: 'https://www.animationsource.org/start.php?sitename=hub&langname=en&act=sendmp&send=1',
    method: 'POST',
    encoding: 'binary',
    headers: headers,
    form: infos
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
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