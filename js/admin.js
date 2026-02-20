// ==========================================
// 관리자 페이지 Logic
// ==========================================

// Firebase 설정은 firebase-init.js에서 처리됩니다.

const ADMIN_PASSWORD = "daekyo123"; // 초기 비밀번호

document.addEventListener('DOMContentLoaded', function () {
    initLogin();
    initTabs();
    initProductManagement();
    initResourceManagement();
    migrateLocalInquiries(); // 로컬에 남은 문의가 있다면 DB로 이동
    initDriveLinkConverter(); // 구글 드라이브 링크 변환 기능 추가
});

// 구글 드라이브 링크를 직링크로 변환하는 함수
function initDriveLinkConverter() {
    const urlInputs = ['prodImage', 'resUrl'];
    urlInputs.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        // 값이 입력될 때마다 체크
        el.addEventListener('input', function () {
            const val = this.value.trim();
            if (val.includes('drive.google.com')) {
                const converted = transformToDirectDownload(val);
                if (converted !== val) {
                    this.value = converted;
                    console.log("Drive Link Converted:", converted);
                    // 시각적 피드백 (배경색 살짝 변경)
                    this.style.backgroundColor = "#e8f5e9";
                    setTimeout(() => this.style.backgroundColor = "", 1000);
                }
            }
        });
    });
}

function transformToDirectDownload(url) {
    // 1. /file/d/ID/ 형식 추출
    let fileId = "";
    const match1 = url.match(/\/file\/d\/([^\/]+)/);
    if (match1) fileId = match1[1];

    // 2. id=ID 형식 추출
    if (!fileId) {
        const match2 = url.match(/[?&]id=([^&]+)/);
        if (match2) fileId = match2[1];
    }

    if (fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return url;
}

// 이미지 선택 핸들러 (카드 등록 없는 무료 방식: base64 + 압축 저장)
window.handleImageSelect = function (input, targetInputId, previewId) {
    const file = input.files[0];
    if (!file) return;

    // 용량 제한 체크 (무료 DB 문서당 1MB 제한 대비)
    if (file.size > 1024 * 1024) {
        alert("파일 용량이 너무 큽니다. (1MB 이하만 가능)");
        input.value = "";
        return;
    }

    const targetInput = document.getElementById(targetInputId);

    // 로딩 상태 표시
    targetInput.value = "파일 처리 중...";
    targetInput.disabled = true;

    const reader = new FileReader();
    reader.onload = function (e) {
        const rawBase64 = e.target.result;

        // 이미지인 경우 압축 시도
        if (file.type.startsWith('image/')) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const max_size = 800;

                if (width > height) {
                    if (width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    }
                } else {
                    if (height > max_size) {
                        width *= max_size / height;
                        height = max_size;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                targetInput.value = compressedBase64;
                targetInput.disabled = false;

                if (previewId) {
                    const previewContainer = document.getElementById(previewId);
                    previewContainer.style.display = 'block';
                    previewContainer.querySelector('img').src = compressedBase64;
                }
            };
            img.src = rawBase64;
        } else {
            // 이미지 이외의 파일 (PDF 등)은 그냥 base64 저장
            targetInput.value = rawBase64;
            targetInput.disabled = false;
            if (previewId) {
                document.getElementById(previewId).style.display = 'none';
            }
            console.log("Non-image file loaded as Base64");
        }
    };
    reader.readAsDataURL(file);
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
        saveProduct();
    });
}

function saveProduct() {
    const id = document.getElementById('editId').value || 'PROD' + Date.now();

    // 스펙 텍스트 처리 (key: value 형태)
    const specsText = document.getElementById('prodSpecs').value;
    const specs = {};
    if (specsText) {
        specsText.split('\n').forEach(line => {
            const [key, ...val] = line.split(':');
            if (key && val.length > 0) {
                specs[key.trim()] = val.join(':').trim();
            }
        });
    }

    const productData = {
        id: id,
        name: document.getElementById('prodName').value,
        mainCategory: document.getElementById('prodMainCat').value,
        subCategory: document.getElementById('prodSubCat').value,
        image: document.getElementById('prodImage').value,
        specs: specs,
        updatedAt: new Date().toISOString(),
        isDB: true // DB에서 가져온 데이터임을 표시
    };

    db.collection("products").doc(id.toString()).set(productData)
        .then(() => {
            alert("제품 정보가 저장되었습니다.");
            closeProductModal();
            renderAdminProductList();
        })
        .catch(err => alert("저장 실패: " + err));
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
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1rem;">데이터 로딩 중...</td></tr>';

    // DB 데이터 가져오기
    db.collection("products").get().then((querySnapshot) => {
        tbody.innerHTML = '';

        // 1. DB 제품 먼저 추가
        const dbProducts = [];
        querySnapshot.forEach((doc) => {
            dbProducts.push(doc.data());
        });

        // 2. 고정 제품 데이터와 합치기 (ID 중복 시 DB 우선)
        const combinedProducts = [...dbProducts];
        products.forEach(p => {
            if (!dbProducts.find(dbP => dbP.id.toString() === p.id.toString())) {
                combinedProducts.push(p);
            }
        });

        // 제품 렌더링
        combinedProducts.forEach(p => {
            const tr = document.createElement('tr');
            const isStatic = !p.isDB;

            tr.innerHTML = `
                <td>${p.id}</td>
                <td><img src="${p.image}" class="admin-img-preview" style="width:50px; height:50px; object-fit:contain;"></td>
                <td><strong>${p.name}</strong> ${isStatic ? '<small style="color:#999;">(고정)</small>' : ''}</td>
                <td>${p.mainCategory} / ${p.subCategory || '-'}</td>
                <td>${p.updatedAt ? p.updatedAt.split('T')[0] : '기본 데이터'}</td>
                <td>
                    <button class="btn-edit btn-sm" onclick="editProduct('${p.id}')">수정</button>
                    ${isStatic ? '' : `<button class="btn-delete btn-sm" onclick="deleteProduct('${p.id}')">삭제</button>`}
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

window.deleteProduct = function (id) {
    if (confirm("이 제품을 데이터베이스에서 삭제하시겠습니까? (고정 제품은 삭제할 수 없습니다.)")) {
        db.collection("products").doc(id.toString()).delete().then(() => {
            alert("삭제되었습니다.");
            renderAdminProductList();
        });
    }
};

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
                <td>${resourceTypes[res.type] || res.type}</td>
                <td><strong>${res.title}</strong></td>
                <td>${res.description}</td>
                <td><small>${res.fileUrl.startsWith('data:') ? '[이미지 데이터]' : res.fileUrl}</small></td>
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
        thumbnail: document.getElementById('resThumb').value, // 썸네일 추가
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
    document.getElementById('resThumbPreview').style.display = 'none'; // 프리뷰 초기화
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
        document.getElementById('resThumb').value = res.thumbnail || "";

        // 썸네일 미리보기 처리
        const thumbPreview = document.getElementById('resThumbPreview');
        if (res.thumbnail) {
            thumbPreview.style.display = 'block';
            thumbPreview.querySelector('img').src = res.thumbnail;
        } else {
            thumbPreview.style.display = 'none';
        }

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
    // 1. 고정 데이터에서 찾기
    let p = products.find(item => item.id.toString() === id.toString());

    // 2. DB에서 찾기 (고정 데이터에 없거나 DB 데이터를 선호할 경우)
    db.collection("products").doc(id.toString()).get().then(doc => {
        if (doc.exists) {
            p = doc.data();
        }

        if (!p) return;

        document.getElementById('modalTitle').textContent = p.isDB ? "제품 정보 수정" : "고정 제품 정보를 수정하여 DB에 저장";
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
    });
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
