import * as firebase from 'firebase';
import { AppRegistry } from 'react-native';
import setup from './js/setup';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA5RHfMVtj36x0f9KAMw_iLFYKfCxFjuuo",
  authDomain: "blurred-195721.firebaseapp.com",
  databaseURL: "https://blurred-195721.firebaseio.com",
  storageBucket: "blurred-195721.appspot.com"
};
const firebaseApp = firebase.initializeApp(firebaseConfig);

AppRegistry.registerComponent('NativeStarterKit', setup);

