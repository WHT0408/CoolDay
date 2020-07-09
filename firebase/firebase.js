import * as firebase from 'firebase';

const config = {
    apiKey: "AIzaSyCFSfIMBOWM3LNLNAARDMIAjxAP1OzuNLE",
    authDomain: "coolday-2fbca.firebaseapp.com",
    databaseURL: "https://coolday-2fbca.firebaseio.com",
    projectId: "coolday-2fbca",
    storageBucket: "coolday-2fbca.appspot.com",
    messagingSenderId: "221356579770",
    appId: "1:221356579770:web:9f0632f7352ff0ee965b83",
    measurementId: "G-1KDBKXV7TH"
};

const app = firebase.initializeApp(config);
export const db = app.database();