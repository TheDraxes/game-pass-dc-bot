const { parentPort } = require('worker_threads');

const admin = require("firebase-admin");
require("firebase/firestore");

var serviceAccount = require(__dirname + "\\creds\\game-pass-crawler-5df759f038a3.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://game-pass-crawler-default-rtdb.europe-west1.firebasedatabase.app"
});

let db = admin.firestore();

// get current data in DD-MM-YYYY format
let date = new Date();
let currDate = `${date.getDate()}-${date.getMonth()}-${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

// recieve crawled data from main thread
parentPort.once("message", (message) => {
    console.log("Recieved data from mainWorker...");
    // store data gotten from main thread in database
    db.collection("Games").doc(currDate).create(message).then(() => {
        // send data back to main thread if operation was successful
        parentPort.postMessage("Data saved successfully");
    })
    .catch((err) => console.log(err))    
});