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

  const sql = 'SELECT id,sitename,date,title,img,author FROM news ORDER BY id DESC LIMIT ' + nb + ' OFFSET ' + offset +';';
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

module.exports.one = function(req,res) {

  const sql = 'SELECT * FROM news WHERE id=' + req.params.id +';';
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
      news: resu.rows[0]
    });
  });
}
