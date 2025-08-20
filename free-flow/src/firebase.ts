// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "removed",
    authDomain: "play-free-flow.firebaseapp.com",
    databaseURL: "https://play-free-flow-default-rtdb.firebaseio.com",
    projectId: "play-free-flow",
    storageBucket: "play-free-flow.firebasestorage.app",
    messagingSenderId: "249776659243",
    appId: "1:249776659243:web:c2a080b46eabf1f6fd036e",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

