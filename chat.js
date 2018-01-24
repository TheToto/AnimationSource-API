const request = require('request');
const https = require("https");
const express = require('express');
const cheerio = require('cheerio');
const bodyParser = require("body-parser"); 

module.exports.getAsChat = function (req, res) {
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
    //'cookie' : 'PHPSESSID=utbcfdvakjq4oua4c3pmk9ucf7'
  }

  var options = {
    url: 'https://www.animationsource.org/engine/ajax/ajax_php_function_call.php',
    method: 'POST',
    encoding: 'binary',
    headers: headers,
    form: {'langname': req.params.lang, // en or fr
          'display_active': '1', 
          'php_function_name': 'displayContent',
          'current_type': 'chat',
          'script_name': 'func_chat',
          'sitename':req.params.sitename, 
          'act':req.params.chat
        } // chat/chat_shared/chat_rpg/chat_mods
  }
  
  request(options, function (error, response, body) {
    const $ = cheerio.load(body);

    var reg = /\'m_id\', \'(\d+)\'\);addJSField\(\'msg_id\', \'(\d+)\'/

    var ids_m = [];
    var ids_a = [];

    var authors = []
    $('.sboxn').each(function(i, elem) {
      authors[i] = $(this).text();
    });
    
    var messages = [];
    $('.sboxtext').each(function(i, elem) {
      $(this).find('img').replaceWith(function() { return $(this).attr("alt"); }) // Remove smileys
      messages[i] = $(this).text().replace('\n',' ');
    });

    var avatars = [];
    $('.sboxa').each(function(i, elem) {
      avatars[i] = $(this).attr('src');
      var tmp = reg.exec($(this).parent().attr('onclick'));
      if (tmp == null || tmp.length < 3) {
        ids_m[i] = -1;
        ids_a[i] = -1;
      } else {
        ids_m[i] = tmp[2];
        ids_a[i] = tmp[1];
      }
    });

    var colors = [];
    $('.sboxb').each(function(i, elem) {
      colors[i] = $(this).css('color');
    });

    var times = [];
    $('.sboxt').each(function(i, elem) {
      times[i] = $(this).text().replace(/\t|\n|\(|\) /g,"");
    });
    reg = /&numg=([0-9]+)/
    var connects = [];
    $('img[width=50]').each(function(i, elem) {
      connects[i] = {
        name: $(this).attr('title'),
        avatar: $(this).attr('src'),
        id: reg.exec($(this).parent().attr('href'))[1]
      }

    });

    //console.log(avatars);
    var result = [];
    for (var i = 0; i < authors.length; i++) {
      result.push({ 
        author: {
          avatar: avatars[i],
          name: authors[i],
          id: ids_a[i]
        }, 
        text: messages[i],
        color: colors[i],
        time: times[i],
        id: ids_m[i]
      })
    }

    if (!error && response.statusCode == 200) {
      res.json({
        messages: result,
        connected: connects,
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
module.exports.getAsActiveChat = function (req, res) {
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
    //'cookie' : 'PHPSESSID=utbcfdvakjq4oua4c3pmk9ucf7'
  }

  var options = {
    url: 'https://www.animationsource.org/engine/ajax/ajax_php_function_call.php',
    method: 'POST',
    encoding: 'binary',
    headers: headers,
    form: {'langname': req.params.lang,
          'display_active': '1',
          'php_function_name': 'displayContent',
          'current_type': 'chat',
          'script_name': 'func_chat',
          'sitename':'roi_lion',
          'act':'actif'
        }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      var reg = /.org\/([^\/]+)\//
      var chats = [];
      $('img[src="https://www.animationsource.org/sites_content/lion_king/img_layout/jungle_hakuna_matata/site_round.png"]').each(function(i, elem) {
        chats[i] = reg.exec($(this).parent().attr('href'))[1];
      });
  
      var texts = [];
      var avatars = [];
      $('.sboxa').each(function(i, elem) {
        avatars[i] = $(this).attr('src');
      });
      var authors = [];
      $('.f9').each(function(i, elem) {
        texts[i] = $(this).find('i').text().slice(1);
        authors[i] = $(this).find('b').text();
      });
  
      var result =[];
      for (var i = 0; i < chats.length; i++) {
        result.push({ 
          chat: chats[i],
          lastmessage: {
            avatar: avatars[i],
            author: authors[i],
            text: texts[i]
          }
        })
      }
  

      res.json({
        count: result.length,
        active: result,
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

module.exports.sendAsChat = function (req, res) {
  //var j = request.jar().setCookie(request.cookie(req.body.cookie, "https://www.animationsource.org/" ); Dont work...
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
    'cookie' : req.body.cookie
  }

  var options = {
    //jar: j,
    url: 'https://www.animationsource.org/engine/ajax/ajax_php_function_call.php',
    method: 'POST',
    encoding: 'binary',
    headers: headers,
    form: {'langname': req.params.lang,
    'display_active': '0',
    'php_function_name': 'insertmessageShoutbox',
    'current_type': 'chat',
    'script_name': 'func_chat',
    'sitename':req.params.sitename,
    'sitelink':"https://",
    'comm':req.body.message,
    //'act':req.params.chat
    act: 'chat' //SECURITY
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