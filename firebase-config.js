// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Replace with your actual Firebase API key
    authDomain: "jeopardish.firebaseapp.com",
    projectId: "jeopardish",
    storageBucket: "jeopardish.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

console.log('🔥 Firebase initialized'); 