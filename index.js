const request = require('request');
const https = require("https");
const express = require('express');
const bodyParser = require("body-parser"); 
const firebase = require('firebase');

const Expo = require('expo-server-sdk');
let expo = new Expo();

const profile = require('./profile');
const mp = require('./mp');
const connect = require('./connect');
const chat = require('./chat');
const search = require('./search');
const fanart = require('./fanart');
const fanfic = require('./fanfic');
const news = require('./news');
const other = require('./other');



const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var router = express.Router(); 

var config = {
  apiKey: "AIzaSyAAUpwhjyLVNr4lfQ2ffi7treBKsApx7Fc",
  authDomain: "as-app-d9d7f.firebaseapp.com",
  databaseURL: "https://as-app-d9d7f.firebaseio.com",
  projectId: "as-app-d9d7f",
  storageBucket: "as-app-d9d7f.appspot.com",
  messagingSenderId: "625654127792"
};
firebase.initializeApp(config);

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

router.route('/notif')
.post(function(req,res){
  var newUserKey = firebase.database().ref().child('users').push().key;
  console.log(req.body);
  var postData = {token: req.body.token};

  var updates = {};
  updates['/users/' + newUserKey] = postData;
  firebase.database().ref().update(updates);
  res.send("Seems ok.");
});

router.route('notif/send')
.post(function(req,res){
  firebase.database().ref('users/').on('value', (snapshot) => {
    const users = snapshot.val();

    let query = [];
    for (var p in users) {
      if( users.hasOwnProperty(p) ) {
        query.push({
          'to': users[p].token,
          'title': req.body.title,
          'body': req.body.body
        });
        
      } 
    }         
    console.log(query);
    let chunks = expo.chunkPushNotifications(query);
    (async () => {
      for (let chunk of chunks) {
        try {
          let receipts = await expo.sendPushNotificationsAsync(chunk);
          res.send(receipts);
        } catch (error) {
          res.send(error);
        }
      }
    })();   
    
  });
});

router.route('/news') // Test connection + return basic infos about user.
//GET
.get(function(req,res){
  news.get(req,res);
})
router.route('/news/:id') // Test connection + return basic infos about user.
//GET
.get(function(req,res){
  news.one(req,res);
})
router.route('/news/:id/comments') // Test connection + return basic infos about user.
.get(function(req,res){
  news.com(req,res);
})
.post(function(req,res){
  news.sendcom(req,res);
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


router.route('/fan:type/:lang/:sitename/') // Fanfic,musics,videos,game books.
// GET
.get(function(req,res){
  fanfic.main(req,res, req.params.type);
})

router.route('/fan:type/:lang/:sitename/:idartist/')
// GET
.get(function(req,res){
  fanfic.artist(req,res, req.params.type);
})

router.route('/fan:type/:lang/:sitename/:idartist/:id*?/comments')
// GET
.get(function(req,res) {
  fanfic.com(req,res, req.params.type);
})
.post(function(req,res) {
  fanfic.sendcom(req,res, req.params.type);
})

router.route('/chars/:lang/:sitename/')
// GET
.get(function(req,res) { // req.query.page = The Page 
  //chars.main(req,res);
  res.json({message : "Soon."});
})

router.route('/custom/')
// GET
.post(function(req,res) {
  other.custom(req,res);
})

router.route('/sitemap/:lang/:sitename')
// GET
.get(function(req,res) {
  other.sitemap(req,res);
})

app.use(router);

app.set('port', (process.env.PORT || 5000));
var test = app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
