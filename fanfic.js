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

  var options = {
    url: 'https://www.animationsource.org/' + req.params.sitename +'/'+ req.params.lang + '/fan' + type + '/&dispall=0',
    method: 'GET',
    encoding: 'binary',
    headers: headers,
    form: { }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      let must_see = [];
      let artists = [];
      let recent = [];
      

      let sel_name = 'fanfics';
      switch(type) {
        case 'video':
          sel_name = 'videos';
          break;
        case 'music':
          sel_name = "musics";
          if (req.params.lang == 'fr')
            sel_name = 'musiques';
          break;
        case 'gbook':
          sel_name = "gamebooks";
          if (req.params.lang == 'fr')
            sel_name = "livres_jeux";
      }

      let sel = "#"+ sel_name + "_a_voir_absolument";
      if (req.params.lang == "en")
        sel = "#must_see_"+sel_name;

      let bool = true;
      var reg = /\/([0-9]+).html/;
      $(sel).find('span > a').each(function(i,e) {
        let fanid = /*reg.exec($(this).attr('href'))[1];*/$(this).attr('href');
        let title = $(this).children().first().text();
        must_see[i] = {
          id: fanid,
          title: title,
          author: $(this).parent().parent().children().last().text().slice(5),
          desc: ""
        }
      });
      $(sel).find('span > i').each(function(i,e) {
        must_see[i].desc = $(this).text();
      });
      
      sel = "#auteurs";
      if (req.params.lang == "en")
        sel = "#authors";

      $(sel).children().each(function(i,e) {
        let taga = $(this).children().first();
        artists[i] = {
          id: reg.exec(taga.attr('href'))[1],
          name: taga.text().slice(4)
        }
      });

      sel = "#recentes_"+sel_name+"_"
      if (req.params.lang == "en")
        sel = "#last_"+sel_name+"_sent_";

      $(sel).children().each(function(i,e) {
        let taga = $(this).children().first();
        let id = taga.attr('href');
        //if (type != 'music')
        //  id = reg.exec(taga.attr('href'))[1];
          
        recent[i] = {
          id: id,
          name: taga.children().first().text().slice(2),
          author: $(this).children().last().text().slice(3)
        }
      });
        
      res.json({
        must_see: must_see,
        artists: artists,
        recent: recent,
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


  var options = {
    url: 'https://www.animationsource.org/' + req.params.sitename +'/'+ req.params.lang + '/fan' + type + '/&numg=' + req.params.idartist,
    method: 'GET',
    encoding: 'binary',
    headers: headers,
    form: { }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      let reg = /\/([0-9]+).html/
      let obj =[];

      let sel_name = 'fanfics';
      switch(type) {
        case 'video':
          sel_name = 'videos';
          break;
        case 'music':
          sel_name = "musics";
          if (req.params.lang == 'fr')
            sel_name = 'musiques';
          break;
        case 'gbook':
          sel_name = "gamebooks";
          if (req.params.lang == 'fr')
            sel_name = "livres_jeux";
      }

      let sel = "#all_"+sel_name+" > center > div > a.f9";
      if (req.params.lang == 'fr')
        sel = "#liste_des_"+sel_name+" > center > div > a.f9";

      $(sel).each(function(i,elem) {
        $(this).children().last().find('img[src="images/shared/book.gif"]').replaceWith('X');
        let id = $(this).attr('href');
        //if (type != 'music') {
        //  id = reg.exec($(this).attr('href'))[1];
        //}
        
        obj[i] = {
          name: $(this).find('.content_important').text(),
          id: id,
          desc: $(this).children().last().text().replace(/\t|\n/g, ''),
          img:  $(this).children().last().find('img').attr('src'),
        }
      });
      let com_sel;
      if (req.params.lang == 'fr') {
        com_sel = '#derniers_commentaires';
      } else {
        com_sel = '#last_comments';
      }
      res.json({
        obj: obj,
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
