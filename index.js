const request = require('request');
const https = require("https");
const express = require('express');
const cheerio = require('cheerio');
const bodyParser = require("body-parser"); 

const profile = require('./profile');
const mp = require('./mp');
const connect = require('./connect');
const chat = require('./chat');
const search = require('./search');
const fanart = require('./fanart');
const { Client } = require('pg');
const jsonfile = require('jsonfile');


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var router = express.Router(); 

let current = 0;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

client.connect();

var headers = {
  'User-Agent':       'Super Agent/0.0.1',
  'Content-Type':     'application/x-www-form-urlencoded',
  //'cookie' : req.body.cookie
}

var options = {
  url: 'https://thetoto.tk/file.json',
  method: 'GET',
  encoding: 'binary',
  headers: headers,
  form: { }
}

request(options, function (error, response, body) {

  if (!error && response.statusCode == 200) {
    console.log("File recup");
    //insert(body);
    var info = JSON.parse(body);
    /*client.query('SELECT id,title,author FROM news;', (err, res) => {
      if (err) throw err;
      for (let row of res.rows) {
        console.log(JSON.stringify(row));
      }
      client.end();
    });*/
    var i = setInterval(function(){
      if (current > info.length) {
        clearInterval(i);
        return;
      }
      console.log('Launch ' + current + ' : ' + info[current].id); 
      insert(info[current]); current++; 
    }, 1000);

  }
});



function insert(e) {

  const text = 'INSERT INTO news(id, title, author, date, sitename, img, content) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *';
  var img = e.img;
  var date = e.date;
  if (e.date == "Invalid date") {
    date = 0;
  }
  if (e.img == undefined) {
    img = "http://";
  }
  var values = [e.id, e.title, e.author, date, e.site, img, e.content];

  client.query(text, values, (err, res) => {
    if (err) {
      console.log(err.stack)
    } else {
      console.log("OK " + res.rows[0].id)
    }
  });
}

router.route('/')
// GET
.get(function(req,res){ 
    res.send('API AnimationSource.org');
})

router.route('/test') // Test connection + return basic infos about user.
//POST
.post(function(req,res){
  connect.testConnect(req,res);
})

router.route('/mp') // Return MP list
//POST
.post(function(req,res){
  mp.getMp(req,res);
})

router.route('/mp/:id') // Return the MP with :id
//POST
.post(function(req,res){
  mp.readMp(req,res);
})

router.route('/mp/send/:id') // Send a message to :id /!\ SITE ID, NOT FORUM ID /!\
// The function will recup some ids and lang informations from the site (hidden input), and after, send the mp with the given message.
//POST
.post(function(req,res){
  mp.send(req,res);
})

router.route('/profile/:id') // Return profile  :id
// GET
.get(function(req,res){ 
    profile.getAsProfile(req,res, 'en', 'hub');
})

router.route('/profile/:lang/:sitename/:id') // Return profile  :id
// GET
.get(function(req,res){ 
    profile.getAsProfile(req,res, req.params.lang, req.params.sitename);
})

router.route('/profile/:id/comments') // GET : Return comments on profile :id, ?page // POST : Send ?comm comment on profile :id
// GET
.get(function(req,res){ 
    profile.getCommentProfile(req,res);
})
.post(function(req,res){
    profile.sendCommentProfile(req,res);
})

router.route('/profile/:lang/:sitename/:id/comments') // GET : Return comments on profile :id, ?page // POST : Send ?comm comment on profile :id
// GET
.get(function(req,res){ 
    profile.getCommentProfile(req,res);
})
.post(function(req,res){
    profile.sendCommentProfile(req,res);
})

router.route('/connect') // Return a PHPSESSID for futur use. A sort of API key lol. Param cookie is needed on all POST request.
// POST user/pass
.post(function(req,res){  
    connect.connect(req,res);
})

router.route('/chat/:lang/active') // Return actives chats
// GET
.get(function(req,res){ 
    chat.getAsActiveChat(req,res);
})

router.route('/chat/:lang/:sitename/:chat') // GET : Return the chat :sitename, :chat can be : 'chat', 'chat_shared' or 'chat_rpg' (sorry mods, you can't access to the mod chat.)
                                            // POST : Send ?message to the chat :sitename
// GET
.get(function(req,res){ 
  chat.getAsChat(req, res);
})
//POST message/cookie
.post(function(req,res){
  chat.sendAsChat(req,res);
});

router.route('/search/:lang/:sitename/:type/:subtype/:search') // Search :search on :sitename. :type can be '...'. :sybtype can be 'object' or 'author'.
// GET
.get(function(req,res){ 
    search.search(req,res);
})



router.route('/fanart/:lang/:sitename/') // Get must_see and artist galleres (?page)
// GET
.get(function(req,res){ // req.query.page = The Page 
  fanart.main(req,res, 'art');
})

router.route('/fanimage/:lang/:sitename/')
// GET
.get(function(req,res){ // req.query.page = The Page 
  fanart.main(req,res, 'image');
})

router.route('/fanart/:lang/:sitename/:idartist/') // Get artist gallerie
// GET
.get(function(req,res){
  fanart.artist(req,res, 'art');
})

router.route('/fanimage/:lang/:sitename/:idartist/')
// GET
.get(function(req,res){
  fanart.artist(req,res, 'image');
})

router.route('/fanart/:lang/:sitename/:idartist/:id*?/comments') // Get comments
// GET
.get(function(req,res){
  fanart.com(req,res, 'art');
})
.post(function(req,res){
  fanart.sendcom(req,res, 'art');
})

router.route('/fanimage/:lang/:sitename/:idartist/:id*?/comments')
// GET
.get(function(req,res){
  fanart.com(req,res, 'image');
})
.post(function(req,res){
  fanart.sendcom(req,res, 'image');
})

router.route('/fanart/:lang/:sitename/:idartist/:id') // Get a fanart.
// GET
.get(function(req,res){
  fanart.view(req,res, 'art');
})

router.route('/fanimage/:lang/:sitename/:idartist/:id')
// GET
.get(function(req,res){
  fanart.view(req,res, 'image');
})




router.route('/fanfic/:lang/:sitename/')
// GET
.get(function(req,res){ // req.query.page = The Page 
  //fanfic.main(req,res);
  res.json({message : "Soon."});
})

router.route('/chars/:lang/:sitename/')
// GET
.get(function(req,res){ // req.query.page = The Page 
  //chars.main(req,res);
  res.json({message : "Soon."});
})

app.use(router);

app.set('port', (process.env.PORT || 5000));
var test = app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
