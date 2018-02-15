const request = require('request');
const https = require("https");
const express = require('express');
const cheerio = require('cheerio');
const bodyParser = require("body-parser"); 

module.exports.custom = function (req, res) {

  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
    //'cookie' : req.body.cookie
  }
  console.log(req.body);
  var options = {
    url: req.body.url,
    method: 'GET',
    encoding: 'binary',
    headers: headers,
    form: {
      
    }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      let success = false;
      let infos = {};
      let elem = $('article');
      if (elem.length > 0) {
        success = true;
        infos = {
          date: $('meta[itemprop="datePublished"]').attr('content'),
          title: $('meta[itemprop="name headline"]').attr('content'),
          content: $('div[itemprop="articleBody"]').html(),
        }
      }
      let tabs = {};
      $('.td_ong').each(function(i,e) {
        tabs[i] = {
          title:$(this).text(),
          url:$(this).parent().attr('href')
        }
      });

      res.json({
        success: success,
        tabs: tabs,
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

module.exports.sitemap = function (req, res) {

  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
    //'cookie' : req.body.cookie
  }
  let url = 'https://www.animationsource.org/' + req.params.sitename +'/'+ req.params.lang + '/send/';
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
      let menu = [];
      let reg = /\/([0-9]+)-[0-9]*.(jpg|png)/
      $('.menusection').each(function(i,e) {
        let img = $(this).children().first().attr('src');
        let id = reg.exec(img)[1];
        let children = [];
        $('#lmenu_'+id).find('li[itemprop="name"]').each(function(i,e) {
          children[i] = {
            url: $(this).find('a').attr('href'),
            title: $(this).find('span').text(),
          }
        });
        if (children.length > 0) {
          menu.push({  
            title: $(this).children().first().attr('title'),
            img: "https://www.animationsource.org/" + img,
            id: id,
            children: children
          });
        }
      });


      res.json({
        menu: menu,
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