// ==========================================
// Firebase 공통 초기화 설정
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyBvV3pOEkmxVpZi8DIj03tdVPHdVthvKjM",
    authDomain: "daekyoace.firebaseapp.com",
    projectId: "daekyoace",
    storageBucket: "daekyoace.firebasestorage.app",
    messagingSenderId: "694653024684",
    appId: "1:694653024684:web:4aac532c696f7ffd95e209",
    measurementId: "G-SGLNMD9P66"
};

// Firebase 초기화 (중복 방지)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const storage = (typeof firebase.storage === "function") ? firebase.storage() : null;
