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

module.exports.readMp = function (req, res) { // NEED TO CLEAN THIS FUNC. NEED BETTER RESPONCE
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
    'cookie' : req.body.cookie
  }

  var options = {
    url: 'https://www.animationsource.org/hub/en/readmp/&read=' + req.params.id,
    method: 'GET',
    encoding: 'binary',
    headers: headers,
    form: { }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      let reg = /&to=([0-9]+)&/;
      let reg2 = /From :(.*?)Date :(.*?)Subject :(.*?)Message :(.*?)<hr>/;
      let removeHTML = /<(?:.|\n)*?>/gm

      //let form = reg.exec($('form[name=pmsend]').attr('action'))[1];
      let content = $('.content_important').parent().html();

      res.json({
        id : req.params.id,
        content: content,
        //author_id: form,
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