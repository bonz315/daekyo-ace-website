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

// ─────────────────────────────────────────────
// Firestore 오프라인 퍼시스턴스 활성화
//   - 한 번 로드된 데이터를 브라우저 로컬(IndexedDB)에 캐싱
//   - 새로고침 시 캐시에서 즉시 표시 → 빈 화면 방지
//   - synchronizeTabs: true → 여러 탭 동시 오픈 시에도 안정 동작
//   - 시크릿 모드, 구형 브라우저는 경고만 출력 후 정상 동작 유지
// ─────────────────────────────────────────────
db.enablePersistence({ synchronizeTabs: true })
    .catch(function (err) {
        if (err.code === 'failed-precondition') {
            // synchronizeTabs 미지원 환경에서 다중 탭 열린 경우
            console.warn('[Firestore] 퍼시스턴스 비활성화: 여러 탭 동시 사용 (정상 동작 유지)');
        } else if (err.code === 'unimplemented') {
            // 시크릿 모드 또는 IndexedDB 미지원 브라우저
            console.warn('[Firestore] 퍼시스턴스 미지원 브라우저 (정상 동작 유지)');
        } else {
            console.warn('[Firestore] 퍼시스턴스 오류:', err);
        }
    });

