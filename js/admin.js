// ==========================================
// 관리자 페이지 Logic
// ==========================================

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyBvV3pOEkmxVpZi8DIj03tdVPHdVthvKjM",
    authDomain: "daekyoace.firebaseapp.com",
    projectId: "daekyoace",
    storageBucket: "daekyoace.firebasestorage.app",
    messagingSenderId: "694653024684",
    appId: "1:694653024684:web:4aac532c696f7ffd95e209",
    measurementId: "G-SGLNMD9P66"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const ADMIN_PASSWORD = "daekyo123"; // 초기 비밀번호

document.addEventListener('DOMContentLoaded', function () {
    initLogin();
    initTabs();
    initProductManagement();
    initResourceManagement();
    migrateLocalInquiries(); // 로컬에 남은 문의가 있다면 DB로 이동
});

// 이미지 선택 핸들러 (파일명 추출 및 프리뷰)
window.handleImageSelect = function (input, targetInputId, previewId) {
    const file = input.files[0];
    if (!file) return;

    // 파일 이름 추출
    const fileName = file.name;
    const targetInput = document.getElementById(targetInputId);

    // 경로에 따라 자동 완성 (제품이면 images/products/, 자료면 files/)
    if (targetInputId === 'prodImage') {
        targetInput.value = 'images/products/' + fileName;
    } else {
        targetInput.value = 'files/' + fileName;
    }

    // 프리뷰 표시 (이미지인 경우)
    if (previewId) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const previewContainer = document.getElementById(previewId);
            previewContainer.style.display = 'block';
            previewContainer.querySelector('img').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

// 1. 로그인 처리
function initLogin() {
    const loginForm = document.getElementById('loginForm');
    const loginSection = document.getElementById('loginSection');
    const adminDashboard = document.getElementById('adminDashboard');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    // 이미 로그인되어 있는지 확인
    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
        loginSection.style.display = 'none';
        adminDashboard.style.display = 'block';
        renderAdminProductList();
        renderAdminResourceListSync();
        renderAdminInquiryListSync(); // 실시간 문의 목록
    }

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const pwd = document.getElementById('adminPassword').value;

        if (pwd === ADMIN_PASSWORD) {
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            loginSection.style.display = 'none';
            adminDashboard.style.display = 'block';
            loginError.style.display = 'none';
            renderAdminProductList();
            renderAdminResourceListSync();
            renderAdminInquiryListSync();
        } else {
            loginError.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', function () {
        sessionStorage.removeItem('isAdminLoggedIn');
        window.location.reload();
    });
}

// 로컬 스토리지 문의 내역 마이그레이션 (동기화 누락 방지)
function migrateLocalInquiries() {
    const localInquiries = JSON.parse(localStorage.getItem('daekyoInquiries') || '[]');
    if (localInquiries.length > 0) {
        console.log("Found local inquiries, migrating to Firebase...");
        let count = 0;
        localInquiries.forEach(inq => {
            db.collection("inquiries").doc(inq.id).set(inq)
                .then(() => {
                    count++;
                    if (count === localInquiries.length) {
                        localStorage.removeItem('daekyoInquiries');
                        console.log("Migration complete.");
                    }
                });
        });
    }
}

// 2. 탭 전환
function initTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetContent = document.getElementById(tab.dataset.tab + 'Tab');
            if (targetContent) targetContent.classList.add('active');
        });
    });
}

// 3. 제품 관리 Logic
function initProductManagement() {
    const mainSelect = document.getElementById('prodMainCat');
    if (!mainSelect) return;

    mainSelect.innerHTML = '<option value="">선택해주세요</option>';
    mainCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        mainSelect.appendChild(opt);
    });

    document.getElementById('productForm').addEventListener('submit', function (e) {
        e.preventDefault();
        alert("제품 정보는 현재 정적 파일(products-data.js)에서 관리됩니다. DB 저장 기능은 추후 확장 예정입니다.");
        closeProductModal();
    });
}

function updateSubSelect() {
    const mainId = document.getElementById('prodMainCat').value;
    const subSelect = document.getElementById('prodSubCat');
    subSelect.innerHTML = '<option value="">선택해주세요</option>';

    if (!mainId) return;

    const subs = subCategories[mainId] || [];
    subs.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub.id;
        opt.textContent = sub.name;
        subSelect.appendChild(opt);
    });
}

// 제품 리스트 렌더링
function renderAdminProductList() {
    const tbody = document.getElementById('adminProductList');
    if (!tbody) return;
    tbody.innerHTML = '';

    // 모든 제품 데이터 가져오기
    products.forEach(p => {
        const tr = document.createElement('tr');

        // 사양 텍스트 요약
        const specSummary = p.specs ? Object.values(p.specs).join(', ').substring(0, 30) + '...' : '-';

        tr.innerHTML = `
            <td>${p.id}</td>
            <td><img src="${p.image}" class="admin-img-preview" style="width:50px; height:50px; object-fit:contain;"></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.mainCategory} / ${p.subCategory || '-'}</td>
            <td>2026-02-20</td>
            <td>
                <button class="btn-edit btn-sm" onclick="editProduct(${p.id})">수정</button>
                <button class="btn-delete btn-sm" onclick="alert('데이터 파일에서 직접 삭제해야 합니다.')">삭제</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 4. 자료실 관리 Logic
function initResourceManagement() {
    const resForm = document.getElementById('resourceForm');
    if (resForm) {
        resForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveResource();
        });
    }
}

function renderAdminResourceListSync() {
    const tbody = document.getElementById('adminResourceList');
    if (!tbody) return;

    db.collection("resources").onSnapshot((querySnapshot) => {
        tbody.innerHTML = '';

        // 기본 데이터(resources-data.js)와 합쳐서 보여주거나 DB 데이터만 보여줌
        // 여기서는 DB 데이터(커스텀 자료) 위주로 표시
        querySnapshot.forEach((doc) => {
            const res = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${res.type === 'catalog' ? '카탈로그' : '인증서'}</td>
                <td><strong>${res.title}</strong></td>
                <td>${res.description}</td>
                <td><small>${res.fileUrl}</small></td>
                <td>
                    <button class="btn-edit btn-sm" onclick="editResource('${res.id}')">수정</button>
                    <button class="btn-delete btn-sm" onclick="deleteResource('${res.id}')">삭제</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

function saveResource() {
    const id = document.getElementById('editResId').value || 'RES' + Date.now();
    const resourceData = {
        id: id,
        title: document.getElementById('resTitle').value,
        type: document.getElementById('resType').value,
        description: document.getElementById('resDesc').value,
        fileInfo: document.getElementById('resInfo').value,
        fileUrl: document.getElementById('resUrl').value,
        updatedAt: new Date().toISOString()
    };

    db.collection("resources").doc(id).set(resourceData)
        .then(() => {
            alert("자료가 저장되었습니다.");
            closeResourceModal();
        })
        .catch(err => alert("저장 실패: " + err));
}

window.openResourceModal = function () {
    document.getElementById('resModalTitle').textContent = "새 자료 등록";
    document.getElementById('resourceForm').reset();
    document.getElementById('editResId').value = "";
    document.getElementById('resourceModal').style.display = 'block';
};

window.closeResourceModal = function () {
    document.getElementById('resourceModal').style.display = 'none';
};

window.editResource = function (id) {
    db.collection("resources").doc(id).get().then(doc => {
        if (!doc.exists) return;
        const res = doc.data();
        document.getElementById('resModalTitle').textContent = "자료 수정";
        document.getElementById('editResId').value = res.id;
        document.getElementById('resTitle').value = res.title;
        document.getElementById('resType').value = res.type;
        document.getElementById('resDesc').value = res.description;
        document.getElementById('resInfo').value = res.fileInfo;
        document.getElementById('resUrl').value = res.fileUrl;
        document.getElementById('resourceModal').style.display = 'block';
    });
};

function deleteResource(id) {
    if (confirm("이 자료를 삭제하시겠습니까?")) {
        db.collection("resources").doc(id).delete();
    }
}

// 5. 문의 관리 Logic (Firebase 실시간 리스너)
function renderAdminInquiryListSync() {
    const tbody = document.getElementById('adminInquiryList');
    if (!tbody) return;

    // 실시간 리스너 설정: 데이터가 변하면 자동으로 호출됨
    db.collection("inquiries")
        .orderBy("date", "desc")
        .onSnapshot((querySnapshot) => {
            tbody.innerHTML = '';

            if (querySnapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:#999;">문의 내역이 없습니다.</td></tr>';
            }

            querySnapshot.forEach((doc) => {
                const inq = doc.data();
                const tr = document.createElement('tr');
                const statusBadge = inq.status === 'answered'
                    ? '<span class="status-badge" style="background:#2ed573; color:white; padding:2px 8px; border-radius:12px; font-size:0.8rem;">답변완료</span>'
                    : '<span class="status-badge" style="background:#ffa502; color:white; padding:2px 8px; border-radius:12px; font-size:0.8rem;">대기중</span>';

                tr.innerHTML = `
                    <td>${inq.id.substring(3, 8)}...</td>
                    <td>${inq.name}<br><small style="color:#999;">${inq.company || '-'}</small></td>
                    <td><strong>${inq.subject}</strong></td>
                    <td>${statusBadge}</td>
                    <td>${inq.date.split(',')[0]}</td>
                    <td>
                        <button class="btn-edit btn-sm" onclick="openAnswerModal('${inq.id}')">답변</button>
                        <button class="btn-delete btn-sm" onclick="deleteInquiry('${inq.id}')">삭제</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }, (error) => {
            console.error("Inquiry Listener Error:", error);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">데이터를 불러오는 중 오류가 발생했습니다. (권한 설정 확인 필요)连</td></tr>';
        });
}

window.openAnswerModal = function (id) {
    db.collection("inquiries").doc(id).get().then((doc) => {
        if (!doc.exists) return;
        const inq = doc.data();

        document.getElementById('answerInqId').value = inq.id;
        document.getElementById('inquiryDetailView').innerHTML = `
            <p><strong>작성자:</strong> ${inq.name} (${inq.phone})</p>
            <p><strong>제목:</strong> ${inq.subject}</p>
            <p style="margin-top:10px; border-top:1px solid #ddd; padding-top:10px;"><strong>내용:</strong><br>${inq.message}</p>
        `;
        document.getElementById('adminAnswerText').value = inq.answer || '';
        document.getElementById('answerModal').style.display = 'block';
    });
};

window.closeAnswerModal = function () {
    document.getElementById('answerModal').style.display = 'none';
};

document.getElementById('answerForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const id = document.getElementById('answerInqId').value;
    const answer = document.getElementById('adminAnswerText').value;

    db.collection("inquiries").doc(id).update({
        answer: answer,
        status: 'answered'
    }).then(() => {
        alert("답변이 등록되었습니다.");
        closeAnswerModal();
    }).catch((error) => {
        console.error("Error updating document: ", error);
        alert("답변 저장 중 오류가 발생했습니다.");
    });
});

function deleteInquiry(id) {
    if (confirm("이 문의 내역을 삭제하시겠습니까? (삭제된 내역은 서버에서 영구 삭제됩니다.)")) {
        db.collection("inquiries").doc(id).delete().then(() => {
            alert("삭제되었습니다.");
        }).catch((error) => {
            console.error("Error removing document: ", error);
            alert("삭제 중 오류가 발생했습니다.");
        });
    }
}

// 모달 제어
function openProductModal() {
    document.getElementById('modalTitle').textContent = "새 제품 등록";
    document.getElementById('productForm').reset();
    document.getElementById('editId').value = "";
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('productModal').style.display = 'block';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

function editProduct(id) {
    const p = products.find(item => item.id === id);
    if (!p) return;

    document.getElementById('modalTitle').textContent = "제품 정보 수정";
    document.getElementById('editId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodMainCat').value = p.mainCategory;
    updateSubSelect();
    document.getElementById('prodSubCat').value = p.subCategory;
    document.getElementById('prodImage').value = p.image;

    // 프리뷰 업데이트
    const preview = document.getElementById('imagePreview');
    preview.style.display = 'block';
    preview.querySelector('img').src = p.image;

    // 스펙 텍스트 변환
    let specText = "";
    if (p.specs) {
        for (let key in p.specs) {
            specText += `${key}: ${p.specs[key]}\n`;
        }
    }
    document.getElementById('prodSpecs').value = specText.trim();

    document.getElementById('productModal').style.display = 'block';
}

// 창 바깥 클릭 시 모달 닫기
window.onclick = function (event) {
    const pModal = document.getElementById('productModal');
    const aModal = document.getElementById('answerModal');
    const cModal = document.getElementById('checkInquiryModal');
    const rModal = document.getElementById('resourceModal');
    if (event.target == pModal) closeProductModal();
    if (event.target == aModal) closeAnswerModal();
    if (event.target == cModal) closeCheckModal();
    if (event.target == rModal) closeResourceModal();
}
