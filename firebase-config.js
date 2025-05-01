const firebaseConfig = {
  apiKey: "AIzaSyDjrGup3nSXN5SHdG8w0lRHQZ5OmLrQCtQ",
  authDomain: "yrtnpro.firebaseapp.com",
  projectId: "yrtnpro",
  storageBucket: "yrtn-news.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:918761047660:web:1b963d7cae358e30237a49"
};

// 初始化Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();