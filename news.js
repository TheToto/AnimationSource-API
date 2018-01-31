const request = require('request');
const https = require("https");
const express = require('express');
const cheerio = require('cheerio');
const bodyParser = require("body-parser"); 
const { Client } = require('pg');
const jsonfile = require('jsonfile');

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

  const sql = 'SELECT * FROM news ORDER BY id DESC LIMIT ' + nb + ' OFFSET' + offset;
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

module.exports.insert = function(req,res) {
  let e = req.body;
  const text = 'INSERT INTO news(id, title, author, date, sitename, img, content) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *';
  var img = e.img;
  var date = e.date;
  var title = e.title;
  if (e.date == "Invalid date") {
    date = 0;
  }
  if (e.img == undefined) {
    img = "http://";
  }
  var values = [e.id, title, e.author, date, e.site, img, e.content];

  client.query(text, values, (err, res) => {
    if (err) {
      res.json({
        status : "error",
        error: err.stack
      });
    } else {
      res.json({
        status : "ok",
        row: res.rows[0]
      });
    }
  });
}