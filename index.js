const request = require('request');
const htmlparser = require("htmlparser2");
const https = require("https");
const express = require('express');
const cheerio = require('cheerio');
var bodyParser = require("body-parser"); 


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var router = express.Router(); 


router.route('/')
// GET
.get(function(req,res){ 
    res.json({message : "Get /", 
    methode : req.method});
})
//POST
.post(function(req,res){
      res.json({message : "Post /", 
      methode : req.method});
});

router.route('/test')
//POST
.post(function(req,res){
  testConnect(req,res);
})

router.route('/mp')
//POST
.post(function(req,res){
  getMp(req,res);
})

router.route('/mp/:id')
//POST
.post(function(req,res){
  readMp(req,res);
})

router.route('/profile/:id')
// GET
.get(function(req,res){ 
    getAsProfile(req,res);
})

router.route('/profile/:id/comments')
// GET
.get(function(req,res){ 
    getCommentProfile(req,res);
})
.post(function(req,res){
    sendCommentProfile(req,res);
})

router.route('/connect')
// POST user/pass
.post(function(req,res){  
    connect(req,res); // Send a PHPSESSID for futur use. A sort of API key lol.
})

router.route('/chat/:lang/active')
// GET
.get(function(req,res){ 
    getAsActiveChat(req,res);
})

router.route('/chat/:lang/:sitename/:chat')
// GET
.get(function(req,res){ 
  getAsChat(req, res);
})
//POST message/cookie
.post(function(req,res){
  sendAsChat(req,res);
});

router.route('/search/:lang/:sitename/:type/:subtype/:search')
// GET
.get(function(req,res){ 
    search(req,res);
})

app.use(router);

app.set('port', (process.env.PORT || 5000));
var test = app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});		

function getAsChat(req, res) {
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

function getAsActiveChat(req, res) {
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

function sendAsChat(req, res) {
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
        error : "error request"
      });
    }
  });
}

function getAsProfile(req, res) {
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
        comments: getCom($, $('#last_comments')),
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

function connect(req, res) {
  var j = request.jar();
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
    //'cookie' : 'PHPSESSID=utbcfdvakjq4oua4c3pmk9ucf7'
  }

  var options = {
    jar: j,
    url: 'https://www.animationsource.org/hub/en/profile/&login=1',
    method: 'POST',
    encoding: 'binary',
    headers: headers,
    form: {'theusername':req.body.user,
            'thepassword':req.body.pass,
            'autologin':'on'
        }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      let success = false;
      let infos = {}
      var reg = /&numg=([0-9]+)/
      if ($('.emsg').length == 0) {
        success = true;
        infos = {
          avatar: $('#avatar').val(),
          pseudo:  $('.bcentre big b').text().slice(1),
          id: reg.exec($('#previewprofile').attr('href'))[1]
        }
      }


      res.json({
        success: success,
        infos: infos,
        cookie: j.getCookieString("https://www.animationsource.org/hub/en/news/&login=1").split(';')[0], // Ugly : return PHPSESSID
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

function getCommentProfile(req, res) {
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
        main = getCom($, $('#last_comments'));
      } else {
        main = getCom($, $('#comments'));
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

function sendCommentProfile(req, res) {

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
        error : "error request"
      });
    }
  });
}

function testConnect(req, res) {

  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded',
    'cookie' : req.body.cookie
  }

  var options = {
    url: 'https://www.animationsource.org/hub/fr/profile/',
    method: 'POST',
    encoding: 'binary',
    headers: headers,
    form: {
      
    }
  }
  
  request(options, function (error, response, body) {

    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(body);
      let success = false;
      let infos = {}
      var reg = /&numg=([0-9]+)/
      if ($('.emsg').length == 0) {
        success = true;
        infos = {
          avatar: $('#avatar').val(),
          pseudo:  $('.bcentre big b').text().slice(1),
          id: reg.exec($('#previewprofile').attr('href'))[1]
        }
      }


      res.json({
        success: success,
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

function getMp(req, res) {
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

function readMp(req, res) { // NEED TO CLEAN THIS FUNC. NEED BETTER RESPONCE
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

      let form = reg.exec($('form[name=pmsend]').attr('action'))[1];
      let content = $('.content_important').parent().html();

      res.json({
        id : req.params.id,
        content: content,
        author_id: form,
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

function search(req, res) { // NEED TO CLEAN THIS FUNC. NEED BETTER RESPONCE
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
      if ($('.emsg').length > 0) { // You have used the search engine a bit too much. This is a very ressource consuming process, so please wait 5 minutes before trying again.
        res.json({
          success: false,
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

function getCom($, elem) {
  var main = [];
  elem.children().each(function(i, elem) {
    if (elem.tagName == "table" || elem.tagName == "br" || elem.tagName == "center" ) {} else {

      var id = $(this).children().first().attr('name').slice(6);
      
      var date = $(this).find('span[itemprop*=datePublished]').first().text();
      var tmpp = $(this).find('.commenttable2').first();
      tmpp.find('img').replaceWith(function() { return $(this).attr("alt"); }) // Remove smileys
      var content = tmpp.text().replace('\n',' ');
      var author_n, author_id, author_av;
      var author = $(this).find('div[itemprop=name]').children().first();
      author_av = author.find('img').first().attr('src');
      author_n = author.find('center').first().text();
      var reg = /([0-9]+).html/
      try {
        author_id = reg.exec(author.find('a').first().attr('href'))[1];
      } catch (e) { author_id = "1"; author_av = "https://www.animationsource.org/images/shared/no_avi_fr.jpg"; }
      

      main[i] = {
        id: id,
        date: date,
        author: {
          id: author_id,
          name: author_n,
          avatar : author_av
        },
        content: content
      }
    }
  });
  return main;
}
