// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQeUAFATdmyO_w7OsAvwsi8S3kxJGSVQk",
  authDomain: "jeoparody-e73a2.firebaseapp.com",
  projectId: "jeoparody-e73a2",
  storageBucket: "jeoparody-e73a2.appspot.com",
  messagingSenderId: "454827013773",
  appId: "1:454827013773:web:a4959239d7a7de6ad0d4c4",
  measurementId: "G-NWVXJRWX92"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Optionally, initialize analytics if you want (and have the analytics script loaded)
if (firebase.analytics) {
  firebase.analytics();
}

// Export the database instance
window.db = db;
