/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import firebase from '@react-native-firebase/app';


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
  
// const config = {
//     apiKey: "AIzaSyBabEr-x0bZKh-Hps3ZsY6h_g1ow4MtZs4",
//     authDomain: "coolday-test.firebaseapp.com",
//     databaseURL: "https://coolday-test.firebaseio.com",
//     projectId: "coolday-test",
//     storageBucket: "coolday-test.appspot.com",
//     messagingSenderId: "471808023743",
//     appId: "1:471808023743:web:d2c0a7f7e785b93d2bfa0a",
//     measurementId: "G-C0YQCGJ0G0"
  
// };


if (!firebase.apps.length) {
    firebase.initializeApp(config);
}

AppRegistry.registerComponent(appName, () => App);