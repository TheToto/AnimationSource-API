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
  connect.testConnect(req,res);
})

router.route('/mp')
//POST
.post(function(req,res){
  mp.getMp(req,res);
})

router.route('/mp/:id')
//POST
.post(function(req,res){
  mp.readMp(req,res);
})

router.route('/mp/send/:id') // SITE ID, NOT FORUM ID /!\
// The function will recup some ids and lang informations from the site (hidden input), and after, send the mp with the given message.
//POST
.post(function(req,res){
  mp.send(req,res);
})

router.route('/profile/:id')
// GET
.get(function(req,res){ 
    profile.getAsProfile(req,res);
})

router.route('/profile/:id/comments')
// GET
.get(function(req,res){ 
    profile.getCommentProfile(req,res);
})
.post(function(req,res){
    profile.sendCommentProfile(req,res);
})

router.route('/connect')
// POST user/pass
.post(function(req,res){  
    connect.connect(req,res); // Send a PHPSESSID for futur use. A sort of API key lol.
})

router.route('/chat/:lang/active')
// GET
.get(function(req,res){ 
    chat.getAsActiveChat(req,res);
})

router.route('/chat/:lang/:sitename/:chat')
// GET
.get(function(req,res){ 
  chat.getAsChat(req, res);
})
//POST message/cookie
.post(function(req,res){
  chat.sendAsChat(req,res);
});

router.route('/search/:lang/:sitename/:type/:subtype/:search')
// GET
.get(function(req,res){ 
    search.search(req,res);
})



router.route('/fanart/:lang/:sitename/')
// GET
.get(function(req,res){ // req.query.page = The Page 
  fanart.main(req,res, 'art');
})

router.route('/fanimage/:lang/:sitename/')
// GET
.get(function(req,res){ // req.query.page = The Page 
  fanart.main(req,res, 'image');
})

router.route('/fanart/:lang/:sitename/:idartist/')
// GET
.get(function(req,res){
  fanart.artist(req,res, 'art');
})

router.route('/fanimage/:lang/:sitename/:idartist/')
// GET
.get(function(req,res){
  fanart.artist(req,res, 'image');
})

router.route('/fanart/:lang/:sitename/:idartist/:id*?/comments')
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

router.route('/fanart/:lang/:sitename/:idartist/:id')
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