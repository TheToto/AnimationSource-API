const request = require('request');
const https = require("https");
const express = require('express');
const cheerio = require('cheerio');
const bodyParser = require("body-parser"); 

module.exports.search = function (req, res) {
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
   // 'cookie' : req.body.cookie
  }

  var options = {
    url: 'https://www.animationsource.org/' + req.params.sitename + '/' + req.params.lang + '/cherche/&searchtext=' + req.params.search + '&searchtype=' + req.params.type + '&subtype=' + req.params.subtype +'&nb=999999',
    method: 'GET',
    encoding: 'binary',
    headers: headers,
    form: { }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      if ($('.emsg').length > 0) {
        res.json({
          success: false,
          error: "You have used the search engine a bit too much. This is a very ressource consuming process, so please wait 5 minutes before trying again.",
          type: req.params.type,
          subtype: req.params.subtype,
          result: [],
          options : options, 
          methode : req.method
        });
        return;
      }
      let reg = /\/([0-9]+).html/
      let regdetails = /&detail=([0-9]+)/
      let list = $('ul.f10');
      let result = [];
      list.children().each(function(i, elem) {
        let link = $(this).find('a').attr('href');
        let id, detail;
        try {
          id = reg.exec(link)[1];
        } catch (e) {}
        try {
          detail = regdetails.exec(link)[1];
        } catch (e) {}

        result[i] = {
          id: id,
          detail: detail,
          content: $(this).find('span').text(),

        }
      });

      res.json({
        success: true,
        type: req.params.type,
        result: result,
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

