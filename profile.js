const request = require('request');
const https = require("https");
const express = require('express');
const cheerio = require('cheerio');
const bodyParser = require("body-parser"); 

const com = require('./com');
let moment = require('moment');

moment.locale('fr', {
  months : 'janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre'.split('_'),
  monthsShort : 'janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.'.split('_'),
  monthsParseExact : true,
  weekdays : 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split('_'),
  weekdaysShort : 'dim._lun._mar._mer._jeu._ven._sam.'.split('_'),
  weekdaysMin : 'Di_Lu_Ma_Me_Je_Ve_Sa'.split('_'),
  weekdaysParseExact : true,
  longDateFormat : {
      LT : 'HH:mm',
      LTS : 'HH:mm:ss',
      L : 'DD/MM/YYYY',
      LL : 'D MMMM YYYY',
      LLL : 'D MMMM YYYY HH:mm',
      LLLL : 'dddd D MMMM YYYY HH:mm'
  },
  calendar : {
      sameDay : '[Aujourd’hui à] LT',
      nextDay : '[Demain à] LT',
      nextWeek : 'dddd [à] LT',
      lastDay : '[Hier à] LT',
      lastWeek : 'dddd [dernier à] LT',
      sameElse : 'L'
  },
  relativeTime : {
      future : 'dans %s',
      past : 'il y a %s',
      s : 'quelques secondes',
      m : 'une minute',
      mm : '%d minutes',
      h : 'une heure',
      hh : '%d heures',
      d : 'un jour',
      dd : '%d jours',
      M : 'un mois',
      MM : '%d mois',
      y : 'un an',
      yy : '%d ans'
  },
  dayOfMonthOrdinalParse : /\d{1,2}(er|e)/,
  ordinal : function (number) {
      return number + (number === 1 ? 'er' : 'e');
  },
  meridiemParse : /PD|MD/,
  isPM : function (input) {
      return input.charAt(0) === 'M';
  },
  // In case the meridiem units are not separated around 12, then implement
  // this function (look at locale/id.js for an example).
  // meridiemHour : function (hour, meridiem) {
  //     return /* 0-23 hour, given meridiem token and hour 1-12 */ ;
  // },
  meridiem : function (hours, minutes, isLower) {
      return hours < 12 ? 'PD' : 'MD';
  },
  week : {
      dow : 1, // Monday is the first day of the week.
      doy : 4  // The week that contains Jan 4th is the first week of the year.
  }
});

function getGalInfo (object) {
  let myreg = /\/([0-9]+).html/;
  let res =  {
    "count" : object.children().last().text(), 
    "id": myreg.exec(object.find('a').attr('href'))[1]
  }
  return res;
}

function getOtherInfo ($,object) {
  let myreg = /\/([0-9]+).html/;
  let array = [];
  object.find('a').each(function (index, elem) {
    array[index] = {
      title: $(this).text(),
      id: myreg.exec($(this).attr('href'))[1]
    }
  });
  let res =  {
    items: array,
  }
  return res;
}

module.exports.getAsProfile = function (req, res, lang, sitename) {
  var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    'Content-Type':     'application/x-www-form-urlencoded'
    //'cookie' : 'PHPSESSID=utbcfdvakjq4oua4c3pmk9ucf7'
  }

  var options = {
    url: 'https://www.animationsource.org/' + sitename + '/' + lang + '/profile/&fullprofile=1&numg='+req.params.id,
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
      let galleries = {};
      let other = {};
      let sel;
      

      if (lang == 'fr')
        sel = '#infos_principales table tbody tr';
      else 
        sel = '#main_information table tbody tr';
      $(sel).each(function(i, elem) {
        if ($(this).children().length == 3) {
          var pos = $(this).children().first().text().replace(/(\s|:)/g, "");
          switch(pos) {
            case "Drawings":
            case "Dessins":
              galleries["fanart"] = getGalInfo($(this));
              break;
            case "Images":
              galleries["fanimage"] = getGalInfo($(this));
              break;
            case "Fanfics":
              galleries["fanfic"] = getGalInfo($(this));
              break;
            case "Gamebooks":
            case "Livres-jeux":
              galleries["fangbook"] = getGalInfo($(this));
              break;
            case "Videos":
            case "Vidéos":
              galleries["video"] = getGalInfo($(this));
              break;
            case "Musics":
            case "Musiques":
              galleries["music"] = getGalInfo($(this));
              break;
            case "Personnages":
            case "Characters":
              other["char"] = getOtherInfo($,$(this));
              break;
            case "Articles":
              other["article"] = getOtherInfo($,$(this));
              break;
            case "Critiques":
            case "Reviews":
              other["review"] = getOtherInfo($,$(this));
              break;
            case "Concours":
            case "Contests":
              other["contest"] = getOtherInfo($,$(this));
              break;
            case "Projets":
            case "Projects":
              other["project"] = getOtherInfo($,$(this));
              break;
            case "Mygroup":
            case "Mongroupe":
              main["group"] = $(this).children().last().text();
              break;
            case "Pays":
            case "Country":
              main["country"] = $(this).children().last().find('img').attr('title');
              break;
            case "Sexe":
            case "Gender":
              main["gender"] = $(this).children().last().find('img').attr('title');
              break;
            case "Adresseemail":
            case "Emailaddress":
              main["email"] = $(this).children().last().text();
            case "Membredepuisle":
            case "Membersince":
              let date = $(this).children().last().text();
              console.log(date);
              main["registration"] = moment(date, "DD MMMM YYYY", lang).format('X');
              break;
            case "Age":
              reg = /\((.+)\)/g
              try {
                let date = reg.exec($(this).children().last().text())[1];
                console.log(date);
                main["birthday"] = moment(date, "DD MMMM YYYY", lang).format('X');
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

      if (lang == 'en')
        sel = '#last_comments';
      else
        sel = '#derniers_commentaires';
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
          galleries: galleries,
          other: other,
          desc: desc
        },
        comments: com.getCom($, $(sel)),
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