var functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
var webpush = require("web-push");
var formidable = require("formidable");
var fs = require("fs");
var UUID = require("uuid-v4");
var os = require("os");
var Busboy = require("busboy");
var path = require('path');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//


var serviceAccount = require("./key-firebase.json");

const gcconfig = {
  projectId: 'l-ilstagram',
  keyFileName: './key-firebase.json'
};

var gcs = require("@google-cloud/storage")(gcconfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://l-ilstagram.firebaseio.com"
});

exports.storePostData = functions.https.onRequest(function(request, response) {
  cors(request, response, function() {
    var uuid = UUID();

    const busboy = new Busboy({ headers: request.headers });
    // These objects will store the values (file + fields) extracted from busboy
    let upload;
    const fields = {};

    // This callback will be invoked for each file uploaded
    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      console.log(
        `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
      );
      const filepath = path.join(os.tmpdir(), filename);
      upload = { file: filepath, type: mimetype };
      file.pipe(fs.createWriteStream(filepath));
    });

    // This will invoked on every field detected
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
      fields[fieldname] = val;
    });

    // This callback will be invoked after all uploaded files are saved.
    busboy.on("finish", () => {
      var bucket = gcs.bucket("l-ilstagram.appspot.com");
      bucket.upload(
        upload.file,
        {
          uploadType: "media",
          metadata: {
            metadata: {
              contentType: upload.type,
              firebaseStorageDownloadTokens: uuid
            }
          }
        },
        function(err, uploadedFile) {
          if (!err) {
            admin
              .database()
              .ref("posts")
              .push({
                id: fields.id,
                title: fields.title,
                location: fields.location,
                image:
                  "https://firebasestorage.googleapis.com/v0/b/" +
                  bucket.name +
                  "/o/" +
                  encodeURIComponent(uploadedFile.name) +
                  "?alt=media&token=" +
                  uuid
              })
              .then(function() {
                webpush.setVapidDetails(
                  'mailto:test@gmail.com',
                  'BDyfedOXAr6Z-aKtV0Xt7jbKh0qIJ9Z8ko8A51H0bXQ4NjKh-M6Rg8i1aueRMSGyU29JKNAgSkLsqUIFt85QVxQ',
                  'CQojViwTKGukBnsXqkpvlBuFJP0FoEzlvsdQ1tATDXw'
                );
                return admin
                  .database()
                  .ref("subscriptions")
                  .once("value");
              })
              .then(function(subscriptions) {
                subscriptions.forEach(function(sub) {
                  var pushConfig = {
                    endpoint: sub.val().endpoint,
                    keys: {
                      auth: sub.val().keys.auth,
                      p256dh: sub.val().keys.p256dh
                    }
                  };

                  webpush
                    .sendNotification(
                      pushConfig,
                      JSON.stringify({
                        title: "New Post",
                        content: "New Post added!",
                        openUrl: "/help"
                      })
                    )
                    .catch(function(err) {
                      console.log(err);
                    });
                });
                response
                  .status(201)
                  .json({ message: "Data stored", id: fields.id });
              })
              .catch(function(err) {
                response.status(500).json({ error: err });
              });
          } else {
            console.log(err);
          }
        }
      );
    });

    // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
    // a callback when it's finished.
    busboy.end(request.rawBody);
    // formData.parse(request, function(err, fields, files) {
    //   fs.rename(files.file.path, "/tmp/" + files.file.name);
    //   var bucket = gcs.bucket("YOUR_PROJECT_ID.appspot.com");
    // });
  });
});



















// const functions = require('firebase-functions');
// const admin = require('firebase-admin');
// const cors = require('cors')({origin: true});
// const webpush = require('web-push');
// const formidable = require('formidable');
// const fs = require('fs');
// const UUID = require('uuid-v4');
//
// // // Create and Deploy Your First Cloud Functions
// // // https://firebase.google.com/docs/functions/write-firebase-functions
// //
//
// var serviceAccount = require("./key-firebase.json");
//
// const gcconfig = {
//   projectId: 'l-ilstagram',
//   keyFileName: './key-firebase.json'
// };
//
// const googleCloudStorage = require('@google-cloud/storage')(gcconfig);
//
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://l-ilstagram.firebaseio.com"
// });
//
// exports.storeInstaData = functions.https.onRequest(function(request, response) {
//  cors(request, response, function() {
//    // hier store je je data in je database; als het andere node server zou zijn, ook hier.
//    var uuid = UUID();
//    var formData = new formidable.IncomingForm();
//    formData.parse(request, function(err, fields,files){
//      fs.rename(files.file.path, '/tmp' + files.file.name);
//      var bucket = googleCloudStorage.bucket('l-ilstagram.appspot.com');
//      // uploading to your storage on firebase
//      bucket.upload('/tmp' + files.file.name, {
//        uploadType: 'media',
//        metadata: {
//          metadata: {
//            contentType: files.file.type,
//            firebaseStorageDownloadTokens: uuid
//          }
//        }
//      }, function(err, file){
//        if(!err){
//          admin.database().ref('posts').push({
//            id: fields.id,
//            title: fields.title,
//            location: fields.location,
//            picture: 'https://firebasestorage.googleapis.com/v0/b/' + bucket.name + '/o/' + encodeURIComponent(file.name)
//            + '?alt=media&token=' + uuid
//          })
//            .then(function() {
//              // set serverside vapid key. arguments: email, public key, private key
//              webpush.setVapidDetails('mailto:test@gmail.com', 'BDyfedOXAr6Z-aKtV0Xt7jbKh0qIJ9Z8ko8A51H0bXQ4NjKh-M6Rg8i1aueRMSGyU29JKNAgSkLsqUIFt85QVxQ', 'CQojViwTKGukBnsXqkpvlBuFJP0FoEzlvsdQ1tATDXw');
//              // now need to get the subscription you stored in your db, to send push noties to
//              return admin.database().ref('subscriptions').once('value');
//            })
//            .then(function(subscriptions){
//              subscriptions.forEach(function(sub){
//                // set pushconfigurations to send messages to (extract it from firebase db)
//                const pushConfig = {
//                  endpoint: sub.val().endpoint,
//                  keys: {
//                    auth: sub.val().keys.auth,
//                    p256dh: sub.val().keys.p256dh
//                  }
//                }
//                webpush.sendNotification(pushConfig, JSON.stringify({title: 'New Post', content: 'New post added!', openUrl: '/feed'}))
//                .catch(function(err){
//                  console.log(err);
//                });
//              });
//              response.status(201).json({message: 'Data stored', id: fields.id});
//            })
//            .catch(function(err) {
//              response.status(500).json({error: err});
//            });
//        });
//        } else {
//          console.log(err);
//        }
//      });
//    });
// });

// now you pushed your notifications messages from your backend to your browser push server (via subscription),
// now to display it; listen to push event in your SW


// dit is je database backend server file, kan dus ook als je mongoDB oid gebruikt. Voor alle Node.JS servers.
