// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyASctnGEv9CHc3u1WDWyd6Yj5rDTc6GVEU",
  authDomain: "stock-tracker-bc591.firebaseapp.com",
  projectId: "stock-tracker-bc591",
  storageBucket: "stock-tracker-bc591.appspot.com",
  messagingSenderId: "436580059338",
  appId: "1:436580059338:web:9a3a00f346817f19590c33",
  measurementId: "G-TXNDTGQDJ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// Get the auth instance



export {  db }; // Export the 'auth' instance