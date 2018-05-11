const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const webpush = require('web-push');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

var serviceAccount = require("./key-firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://l-ilstagram.firebaseio.com"
});

exports.storeInstaData = functions.https.onRequest(function(request, response) {
 cors(request, response, function() {
   // hier store je je data in je database; als het andere node server zou zijn, ook hier.
   admin.database().ref('posts').push({
     id: request.body.id,
     title: request.body.title,
     location: request.body.location,
     image: request.body.image
   })
     .then(function() {
       // set serverside vapid key. arguments: email, public key, private key
       webpush.setVapidDetails('mailto:test@gmail.com', 'BDyfedOXAr6Z-aKtV0Xt7jbKh0qIJ9Z8ko8A51H0bXQ4NjKh-M6Rg8i1aueRMSGyU29JKNAgSkLsqUIFt85QVxQ', 'CQojViwTKGukBnsXqkpvlBuFJP0FoEzlvsdQ1tATDXw');
       // now need to get the subscription you stored in your db, to send push noties to
       return admin.database().ref('subscriptions').once('value');
     })
     .then(function(subscriptions){
       subscriptions.forEach(function(sub){
         // set pushconfigurations to send messages to (extract it from firebase db)
         const pushConfig = {
           endpoint: sub.val().endpoint,
           keys: {
             auth: sub.val().keys.auth,
             p256dh: sub.val().keys.p256dh
           }
         }
         webpush.sendNotification(pushConfig, JSON.stringify({title: 'New Post', content: 'New post added!', openUrl: '/feed'}))
         .catch(function(err){
           console.log(err);
         });
       });
       response.status(201).json({message: 'Data stored', id: request.body.id});
     })
     .catch(function(err) {
       response.status(500).json({error: err});
     });
 });
});

// now you pushed your notifications messages from your backend to your browser push server (via subscription),
// now to display it; listen to push event in your SW


// dit is je database backend server file, kan dus ook als je mongoDB oid gebruikt. Voor alle Node.JS servers.
