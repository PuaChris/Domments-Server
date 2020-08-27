const admin = require('firebase-admin');
// require('firebase/firestore';
// const firestore = require('firebase');
const express = require('express');
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

server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
})

server.get("/", (req, res) => {
  res.send("Hello world!");
})

server.get("/user", (req, res) => {
  FirestoreHelper.initializeDb(db)
  .then((userData) => {
    res.json(userData);
  });
})

server.get("/comments", (req, res) => {
  console.log("Retrieving comments...");

  const userData = { userId: req.query.userId, userName: req.query.userName };
  const website = req.query.website;
  
  FirestoreHelper.getComments(db, userData, website)
  .then((commentList) => {
    console.log(commentList);
    res.send(commentList);
    console.log("Retrieved " + commentList.length + " comments.");
  })
})

server.get("/comments", (req, res) => {
  
})

const PORT = 4000;
server.listen(PORT, () => console.log("Server is running at http://localhost:4000/"));

