const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const FirestoreHelper = require('./firestore-helper');

require('dotenv').config();

// https://stackoverflow.com/questions/41287108/deploying-firebase-app-with-service-account-to-heroku-environment-variables-wit
// Someone said that some environments might have troubles with newlines in the `private_key` env var and put up a solution for it
admin.initializeApp({
  credential: admin.credential.cert({
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
  }),
  databaseURL: 'https://domments.firebaseio.com'
});

const db = admin.firestore();
const server = express();

// To bypass the "Same Origin" security policy to prevent cross-browser origin risks
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
})

server.get("/", (req, res) => {
  res.send(`Hello world!`);
})

// Return user data after verifying login information
server.get('/users/:userId', (req, res) => {
  const userId = req.params.userId;
  FirestoreHelper.initializeDb(db, userId)
  .then((userData) => {
    if (!userData) {
      res.status(500);
    }
    console.log(`Database successfully initialized. Returning user data.\n`);
    res.json(userData);
  })
  .catch((error) => {
    console.error(`Error initializing database -> ${error}\n`);
  });
})

// Return all comments for current website
server.get('/users/:userId/website/:website/comments', (req, res) => {
  console.log(`Retrieving comments...`);
  
  const website = req.params.website;
  const userData = { 
    userDocId: req.query.userDocId, 
    userId: req.params.userId, 
    userName: req.query.userName 
  };
  
  FirestoreHelper.getComments(db, userData, website)
  .then((commentList) => {
    console.log(commentList);
    console.log(`Retrieved ${commentList.length} comment(s).\n`);
    res.send(commentList);
  })
  .catch((error) => {
    console.error(`Error retriving comments -> ${error}\n`);
  });
})

// Let Firestore generate a unique document ID for new comments 
server.get('/users/:userId/website/:website/comments/newid', (req, res) => {
  console.log(`Generating new comment ID...`);
  const website = req.query.website;
  const userData = { 
    userDocId: req.query.userDocId, 
    userId: req.params.userId,
  };
  FirestoreHelper.getNewCommentId(db, userData, website)
  .then((newCommentId) => {
    res.json(newCommentId);
    console.log(`New comment ID ${newCommentId} successfully generated.\n`);
  })
})

// Adding or modifying comment
server.post('/users/:userId/website/:website/comments/:commentId', (req, res) => {
  console.log(`Saving comment...`);
  const commentId = req.params.commentId;
  const userData = {
    userDocId: req.query.userDocId,
    userId: req.params.userId,
    userName: req.query.userName
  };
  const website = req.params.website;
  const message = req.query.message;

  FirestoreHelper.saveComment(db, userData, website, commentId, message)
  .then((commentData) => {
    console.log(`Successfully saved new comment.\n`)
    res.json(commentData);
  })
  .catch((error) => {
    console.error(`Error saving comment -> ${error}\n`);
  });
})

server.options('/users/:userId/website/:website/comments/:commentId', cors());
server.delete('/users/:userId/website/:website/comments/:commentId', cors(), (req, res) => {
  console.log(`Deleting comment...`);
  const commentId = req.params.commentId;
  const userData = { 
    userDocId: req.query.userDocId, 
    userId: req.params.userId, 
  };
  const website = req.params.website;
  FirestoreHelper.deleteComment(db, userData, website, commentId)
  .then(() => {
    console.log(`Comment ${commentId} successfully deleted.\n`);
    res.sendStatus(200);
  })
  .catch((error) => {
    console.error(`Error deleting comment -> ${error}\n`);
  });
})

const PORT = 4000;
server.listen(process.env.PORT || PORT, () => console.log(`Server is running at ${process.env.PORT}\n`));

