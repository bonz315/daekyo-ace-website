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

// 실제 저장 Logic (여기서는 결과 코드를 생성해 사용자에게 전달하는 시뮬레이션)
function saveProduct() {
    const id = document.getElementById('editId').value;
    const name = document.getElementById('prodName').value;
    const main = document.getElementById('prodMainCat').value;
    const sub = document.getElementById('prodSubCat').value;
    const image = document.getElementById('prodImage').value;
    const specsRaw = document.getElementById('prodSpecs').value;

    // 스펙 파싱
    const specs = {};
    specsRaw.split('\n').forEach(line => {
        const [key, ...val] = line.split(':');
        if (key && val.length) {
            specs[key.trim()] = val.join(':').trim();
        }
    });

    const newData = {
        id: id ? parseInt(id) : products.length + 1,
        name,
        mainCategory: main,
        subCategory: sub,
        image,
        specs
    };

    console.log("새로운 데이터가 생성되었습니다:", newData);

    alert("데이터 저장이 완료되었습니다.\n\n[알림] 현재는 데모 모드입니다. 실제 웹사이트에 영구적으로 반영하려면 생성된 데이터를 AI에게 전달하여 수정을 요청해주세요.");

    closeProductModal();
    // 시뮬레이션을 위해 메모리상 데이터 업데이트 (새로고침 시 사라짐)
    if (id) {
        const index = products.findIndex(item => item.id === parseInt(id));
        products[index] = newData;
    } else {
        products.push(newData);
    }
    renderAdminProductList();
}

function deleteProduct(id) {
    if (confirm("정말로 이 제품을 삭제하시겠습니까?")) {
        const index = products.findIndex(item => item.id === id);
        products.splice(index, 1);
        renderAdminProductList();
        alert("삭제되었습니다.");
    }
}

// 창 바깥 클릭 시 모달 닫기
window.onclick = function (event) {
    const modal = document.getElementById('productModal');
    if (event.target == modal) {
        closeProductModal();
    }
}
