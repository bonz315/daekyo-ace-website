// ==========================================
// 관리자 페이지 Logic
// ==========================================

const ADMIN_PASSWORD = "daekyo123"; // 초기 비밀번호

document.addEventListener('DOMContentLoaded', function () {
    initLogin();
    initTabs();
    initProductManagement();
});

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
        renderAdminInquiryList();
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
            renderAdminInquiryList();
        } else {
            loginError.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', function () {
        sessionStorage.removeItem('isAdminLoggedIn');
        window.location.reload();
    });
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
            document.getElementById(tab.dataset.tab + 'Tab').classList.add('active');

            // 데이터 새로고침
            if (tab.dataset.tab === 'inquiry') renderAdminInquiryList();
        });
    });
}

// 3. 제품 관리 Logic
function initProductManagement() {
    // 상품 등록 폼 선택 시 카테고리 셀렉트박스 채우기
    const mainSelect = document.getElementById('prodMainCat');
    mainSelect.innerHTML = '<option value="">선택해주세요</option>';
    mainCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        mainSelect.appendChild(opt);
    });

    document.getElementById('productForm').addEventListener('submit', function (e) {
        e.preventDefault();
        saveProduct();
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
    tbody.innerHTML = '';

    // 모든 제품 데이터 가져오기
    products.forEach(p => {
        const tr = document.createElement('tr');

        // 사양 텍스트 요약
        const specSummary = p.specs ? Object.values(p.specs).join(', ').substring(0, 30) + '...' : '-';

        tr.innerHTML = `
            <td>${p.id}</td>
            <td><img src="${p.image}" class="admin-img-preview"></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.mainCategory} / ${p.subCategory}</td>
            <td>2026-01-16</td>
            <td>
                <button class="btn-edit btn-sm" onclick="editProduct(${p.id})">수정</button>
                <button class="btn-delete btn-sm" onclick="deleteProduct(${p.id})">삭제</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 모달 제어
function openProductModal() {
    document.getElementById('modalTitle').textContent = "새 제품 등록";
    document.getElementById('productForm').reset();
    document.getElementById('editId').value = "";
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

// 4. 문의 관리 Logic
function renderAdminInquiryList() {
    const tbody = document.getElementById('adminInquiryList');
    if (!tbody) return;
    tbody.innerHTML = '';

    const inquiries = JSON.parse(localStorage.getItem('daekyoInquiries') || '[]');

    inquiries.reverse().forEach(inq => {
        const tr = document.createElement('tr');
        const statusBadge = inq.status === 'answered'
            ? '<span class="status-badge" style="background:#2ed573; color:white; padding:2px 8px; border-radius:12px; font-size:0.8rem;">답변완료</span>'
            : '<span class="status-badge" style="background:#ffa502; color:white; padding:2px 8px; border-radius:12px; font-size:0.8rem;">대기중</span>';

        tr.innerHTML = `
            <td>${inq.id.substring(3, 8)}...</td>
            <td>${inq.name}<br><small style="color:#999;">${inq.company || '-'}</small></td>
            <td><strong>${inq.subject}</strong></td>
            <td>${statusBadge}</td>
            <td>${inq.date}</td>
            <td>
                <button class="btn-edit btn-sm" onclick="openAnswerModal('${inq.id}')">답변</button>
                <button class="btn-delete btn-sm" onclick="deleteInquiry('${inq.id}')">삭제</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.openAnswerModal = function (id) {
    const inquiries = JSON.parse(localStorage.getItem('daekyoInquiries') || '[]');
    const inq = inquiries.find(item => item.id === id);
    if (!inq) return;

    document.getElementById('answerInqId').value = inq.id;
    document.getElementById('inquiryDetailView').innerHTML = `
        <p><strong>작성자:</strong> ${inq.name} (${inq.phone})</p>
        <p><strong>제목:</strong> ${inq.subject}</p>
        <p style="margin-top:10px; border-top:1px solid #ddd; pt:10px;"><strong>내용:</strong><br>${inq.message}</p>
    `;
    document.getElementById('adminAnswerText').value = inq.answer || '';
    document.getElementById('answerModal').style.display = 'block';
};

window.closeAnswerModal = function () {
    document.getElementById('answerModal').style.display = 'none';
};

document.getElementById('answerForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const id = document.getElementById('answerInqId').value;
    const answer = document.getElementById('adminAnswerText').value;

    const inquiries = JSON.parse(localStorage.getItem('daekyoInquiries') || '[]');
    const index = inquiries.findIndex(item => item.id === id);

    if (index !== -1) {
        inquiries[index].answer = answer;
        inquiries[index].status = 'answered';
        localStorage.setItem('daekyoInquiries', JSON.stringify(inquiries));
        alert("답변이 등록되었습니다.");
        closeAnswerModal();
        renderAdminInquiryList();
    }
});

function deleteInquiry(id) {
    if (confirm("이 문의 내역을 삭제하시겠습니까? (삭제된 내역은 복구할 수 없으며 고객도 볼 수 없게 됩니다.)")) {
        let inquiries = JSON.parse(localStorage.getItem('daekyoInquiries') || '[]');
        inquiries = inquiries.filter(item => item.id !== id);
        localStorage.setItem('daekyoInquiries', JSON.stringify(inquiries));
        renderAdminInquiryList();
    }
}

// 창 바깥 클릭 시 모달 닫기
window.onclick = function (event) {
    const pModal = document.getElementById('productModal');
    const aModal = document.getElementById('answerModal');
    const cModal = document.getElementById('checkInquiryModal');
    if (event.target == pModal) closeProductModal();
    if (event.target == aModal) closeAnswerModal();
    if (event.target == cModal) closeCheckModal();
}
