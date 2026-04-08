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
//   - Safari는 ITP(지능형 추적 방지) 정책으로 IndexedDB가 차단될 수 있음
//   - 퍼시스턴스 실패 시에도 데이터 로딩은 반드시 정상 동작해야 함
//   - synchronizeTabs: false → Safari 호환성 우선 (탭 간 동기화 포기)
// ─────────────────────────────────────────────

// Safari 감지: userAgent로 판별
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

if (!isSafari) {
    // Chrome, Edge, Firefox: 오프라인 퍼시스턴스 활성화 (성능 향상)
    db.enablePersistence({ synchronizeTabs: false })
        .catch(function (err) {
            if (err.code === 'failed-precondition') {
                console.warn('[Firestore] 퍼시스턴스 비활성화: 여러 탭 동시 사용 (정상 동작 유지)');
            } else if (err.code === 'unimplemented') {
                console.warn('[Firestore] 퍼시스턴스 미지원 환경 (정상 동작 유지)');
            } else {
                console.warn('[Firestore] 퍼시스턴스 오류 (정상 동작 유지):', err);
            }
        });
} else {
    // Safari: 퍼시스턴스 완전 비활성화 → 빈 화면 방지
    console.info('[Firestore] Safari 감지: 오프라인 캐시 비활성화 (온라인 실시간 조회로 동작)');
}

