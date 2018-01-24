const request = require('request');
const https = require("https");
const express = require('express');
const cheerio = require('cheerio');
const bodyParser = require("body-parser"); 

module.exports.getCom = function ($, elem) {
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