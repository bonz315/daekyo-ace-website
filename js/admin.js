// ==========================================
// 관리자 페이지 Logic
// ==========================================

// Firebase 설정은 firebase-init.js에서 처리됩니다.

const ADMIN_PASSWORD = "daekyo123"; // 초기 비밀번호

document.addEventListener('DOMContentLoaded', function () {
    initLogin();
    initTabs();
    initProductManagement();
    initCategoryManagement();
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

// 이미지/파일 선택 핸들러 (PDF 썸네일 자동 생성 기능 포함)
window.handleImageSelect = function (input, targetInputId, previewId) {
    const file = input.files[0];
    if (!file) return;

    if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
        alert("이미지 용량이 너무 큽니다. (1MB 이하만 가능)");
        input.value = "";
        return;
    }

    // targetInputId/previewId가 엘리먼트일 수도 있고 ID 스트링일 수도 있게 처리
    const targetInput = typeof targetInputId === 'string'
        ? document.getElementById(targetInputId)
        : targetInputId;

    if (!targetInput) return;

    targetInput.value = "파일 처리 중...";
    targetInput.disabled = true;

    const reader = new FileReader();
    reader.onload = async function (e) {
        const rawData = e.target.result;

        if (file.type === 'application/pdf') {
            try {
                targetInput.value = "PDF 분석 중...";
                const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
                const infoInput = document.getElementById('resInfo');
                if (infoInput) {
                    infoInput.value = `PDF, ${fileSizeMB}MB | ${new Date().toLocaleDateString()}`;
                }

                const thumbnailBase64 = await generatePdfThumbnail(rawData);

                const thumbInput = document.getElementById('resThumb');
                if (thumbInput) {
                    thumbInput.value = thumbnailBase64;
                    const thumbPreview = document.getElementById('resThumbPreview');
                    const previewToUse = thumbPreview || (typeof previewId !== 'string' ? previewId : null);
                    if (previewToUse) {
                        previewToUse.style.display = 'block';
                        previewToUse.querySelector('img').src = thumbnailBase64;
                    }
                }

                if (file.size < 1024 * 1024) {
                    targetInput.value = rawData;
                } else {
                    targetInput.value = "";
                    alert("파일이 1MB를 초과하여 직접 저장할 수 없습니다.");
                }
            } catch (err) {
                console.error("PDF Thumbnail Error:", err);
            }
            targetInput.disabled = false;
        }
        else if (file.type.startsWith('image/')) {
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

                const previewContainer = typeof previewId === 'string'
                    ? document.getElementById(previewId)
                    : previewId;

                if (previewContainer) {
                    previewContainer.style.display = 'block';
                    previewContainer.querySelector('img').src = compressedBase64;
                }
            };
            img.src = rawData;
        } else {
            targetInput.value = rawData;
            targetInput.disabled = false;
        }
    };
    reader.readAsDataURL(file);
};

// PDF 첫 페이지를 이미지로 변환하는 마법 같은 함수
async function generatePdfThumbnail(pdfBase64) {
    const loadingTask = pdfjsLib.getDocument(pdfBase64);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1); // 1페이지만 가져옴

    const viewport = page.getViewport({ scale: 0.5 }); // 크기를 적당히 조절 (썸네일용)
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;

    // 썸네일은 용량이 작아야 하므로 압축된 jpeg로 반환
    return canvas.toDataURL('image/jpeg', 0.8);
}

// 1. 로그인 처리
function initLogin() {
    const loginForm = document.getElementById('loginForm');
    const adminLogin = document.getElementById('adminLogin');
    const adminDashboard = document.getElementById('adminDashboard');

    // 이미 로그인되어 있는지 확인
    if (sessionStorage.getItem('isAdminLoggedIn') === 'true') {
        if (adminLogin) adminLogin.style.display = 'none';
        if (adminDashboard) adminDashboard.style.display = 'block';
        renderAdminProductList();
        renderAdminCategoryList();
        renderAdminResourceListSync();
        renderAdminInquiryListSync(); // 실시간 문의 목록
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const pwd = document.getElementById('adminPassword').value;

            if (pwd === ADMIN_PASSWORD) {
                sessionStorage.setItem('isAdminLoggedIn', 'true');
                if (adminLogin) adminLogin.style.display = 'none';
                if (adminDashboard) adminDashboard.style.display = 'block';
                renderAdminProductList();
                renderAdminCategoryList();
                renderAdminResourceListSync();
                renderAdminInquiryListSync();
            } else {
                alert("비밀번호가 일치하지 않습니다.");
            }
        });
    }
}

// 로그아웃
function logout() {
    sessionStorage.removeItem('isAdminLoggedIn');
    window.location.reload();
}
window.logout = logout;

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

            if (tab.dataset.tab === 'category') {
                renderAdminCategoryList();
            }
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

    // 1. 상세 사양 객체 구성
    const specs = {
        name: document.getElementById('specName').value,
        size: document.getElementById('specSize').value,
        material: document.getElementById('specMaterial').value,
        color: document.getElementById('specColor').value,
        certification: document.getElementById('specCert').value
    };

    // 2. 다중 이미지 수집
    const imageUrls = Array.from(document.querySelectorAll('.prod-image-url'))
        .map(input => input.value.trim())
        .filter(url => url !== "");

    const productData = {
        id: id,
        name: document.getElementById('prodName').value,
        isRecommended: document.getElementById('prodIsRecommended').checked, // 메인 노출 여부
        mainCategory: document.getElementById('prodMainCat').value,
        subCategory: document.getElementById('prodSubCat').value,
        image: imageUrls[0] || "", // 첫 번째 이미지를 대표 이미지로
        images: imageUrls,         // 전체 이미지 배열
        cardSize: document.getElementById('prodCardSize').value,
        description: document.getElementById('prodDesc').value,
        specs: specs,
        updatedAt: new Date().toISOString(),
        isDB: true
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
                <td>
                    <strong>${p.name}</strong> ${isStatic ? '<small style="color:#999;">(고정)</small>' : ''}
                    ${p.isRecommended ? '<span style="background:var(--primary-orange); color:white; font-size:10px; padding:2px 5px; border-radius:4px; margin-left:5px;">주요제품</span>' : ''}
                </td>
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

function editResource(id) {
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
}
window.editResource = editResource;

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
    document.getElementById('prodIsRecommended').checked = false; // 기본값 해제

    // 이미지 입력창 초기화
    const container = document.getElementById('imageInputContainer');
    container.innerHTML = "";
    addImageInput();

    document.getElementById('productModal').style.display = 'block';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}
window.closeProductModal = closeProductModal;

function editProduct(id) {
    db.collection("products").doc(id.toString()).get().then((doc) => {
        if (!doc.exists) return;
        const p = doc.data();
        window.openProductModal(); // 초기화
        document.getElementById('modalTitle').textContent = "제품 수정";
        document.getElementById('editId').value = p.id;
        document.getElementById('prodName').value = p.name;
        document.getElementById('prodIsRecommended').checked = p.isRecommended || false;
        document.getElementById('prodMainCat').value = p.mainCategory;
        updateSubSelect();
        document.getElementById('prodSubCat').value = p.subCategory || "";
        document.getElementById('prodCardSize').value = p.cardSize || "";
        document.getElementById('prodDesc').value = p.description || "";

        // 이미지 로딩
        const container = document.getElementById('imageInputContainer');
        container.innerHTML = "";
        if (p.images && p.images.length > 0) {
            p.images.forEach(imgUrl => window.addImageInput(imgUrl));
        } else if (p.image) {
            window.addImageInput(p.image);
        } else {
            window.addImageInput();
        }

        // 사양 로딩
        if (p.specs) {
            document.getElementById('specName').value = p.specs.name || "";
            document.getElementById('specSize').value = p.specs.size || "";
            document.getElementById('specMaterial').value = p.specs.material || "";
            document.getElementById('specColor').value = p.specs.color || "";
            document.getElementById('specCert').value = p.specs.cert || "";
        } else {
            document.getElementById('specName').value = "";
            document.getElementById('specSize').value = "";
            document.getElementById('specMaterial').value = "";
            document.getElementById('specColor').value = "";
            document.getElementById('specCert').value = "";
        }

        document.getElementById('productModal').style.display = 'block';
    });
}

// 이미지 필드 동적 추가/삭제
window.addImageInput = function (value = "") {
    const container = document.getElementById('imageInputContainer');
    if (!container) return;

    const childCount = container.children.length;
    if (childCount >= 5) {
        alert("이미지는 최대 5장까지 등록 가능합니다.");
        return;
    }

    const div = document.createElement('div');
    div.className = 'image-input-row';
    div.style.marginBottom = '0.8rem';
    div.innerHTML = `
        <div style="display: flex; gap: 0.5rem; align-items: flex-start;">
            <div style="flex: 1;">
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" class="prod-image-url" placeholder="이미지 경로 또는 직접 업로드" style="flex: 1;" value="${value}">
                    <input type="file" style="display: none;" onchange="handleImageSelect(this, this.previousElementSibling, this.parentElement.nextElementSibling)">
                    <button type="button" class="btn-outline btn-sm" onclick="this.previousElementSibling.click()" style="white-space:nowrap; padding: 0 10px;">파일</button>
                </div>
                <div class="image-preview-mini" style="margin-top: 5px; display: ${value ? 'block' : 'none'};">
                    <img src="${value}" style="height: 60px; border-radius: 4px; border: 1px solid #ddd; object-fit: contain;">
                </div>
            </div>
            <button type="button" class="btn-delete btn-sm" onclick="removeImageInput(this)" style="padding: 0.4rem 0.8rem;">✕</button>
        </div>
    `;
    container.appendChild(div);
};

window.removeImageInput = function (btn) {
    const container = document.getElementById('imageInputContainer');
    if (container.children.length > 1) {
        btn.closest('.image-input-row').remove();
    } else {
        alert("최소 한 장의 이미지는 필요합니다.");
    }
};

// ==========================================
// 6. 카테고리 관리 Logic
// ==========================================
function initCategoryManagement() {
    const mainCatForm = document.getElementById('mainCategoryForm');
    if (mainCatForm) {
        mainCatForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveMainCategory();
        });
    }

    const subCatForm = document.getElementById('subCategoryForm');
    if (subCatForm) {
        subCatForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveSubCategory();
        });
    }
}

// 대분류 리스트 렌더링
function renderAdminCategoryList() {
    const mainList = document.getElementById('adminMainCategoryList');
    const subList = document.getElementById('adminSubCategoryList');
    if (!mainList || !subList) return;

    mainList.innerHTML = '<tr><td colspan="6" style="text-align:center;">로딩 중...</td></tr>';
    subList.innerHTML = '<tr><td colspan="5" style="text-align:center;">로딩 중...</td></tr>';

    // 카테고리 로드 후 렌더링
    if (typeof loadCategories === 'function') {
        loadCategories().then(() => {
            // 대분류 렌더링
            mainList.innerHTML = '';
            mainCategories.forEach((cat, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${cat.id}</td>
                    <td style="font-size:1.5rem;">${cat.icon || ''}</td>
                    <td><strong>${cat.name}</strong></td>
                    <td><span style="display:inline-block; width:20px; height:20px; background:${cat.color}; border-radius:4px; vertical-align:middle; margin-right:5px;"></span> ${cat.color || ''}</td>
                    <td>${cat.image ? '<img src="' + cat.image + '" style="height:30px;">' : '-'}</td>
                    <td>
                        <button class="btn-edit btn-sm" onclick="editMainCategory(${index})">수정</button>
                        <button class="btn-delete btn-sm" onclick="deleteMainCategory(${index})">삭제</button>
                    </td>
                `;
                mainList.appendChild(tr);
            });

            // 중분류 렌더링
            subList.innerHTML = '';
            Object.keys(subCategories).forEach(mainId => {
                const mainCat = getMainCategory(mainId);
                const mainName = mainCat ? mainCat.name : mainId;

                subCategories[mainId].forEach((sub, index) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><small>${mainName}</small></td>
                        <td>${sub.id}</td>
                        <td><strong>${sub.name}</strong></td>
                        <td>${sub.description || '-'}</td>
                        <td>
                            <button class="btn-edit btn-sm" onclick="editSubCategory('${mainId}', ${index})">수정</button>
                            <button class="btn-delete btn-sm" onclick="deleteSubCategory('${mainId}', ${index})">삭제</button>
                        </td>
                    `;
                    subList.appendChild(tr);
                });
            });

            // 제품 등록용 대분류 선택창 업데이트
            updateProductMainCatSelect();
        }).catch(err => {
            console.error("Error categories load/render:", err);
            mainList.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">카테고리를 불러올 수 없습니다.</td></tr>';
        });
    }
}

function updateProductMainCatSelect() {
    const mainSelect = document.getElementById('prodMainCat');
    if (!mainSelect) return;

    const currentVal = mainSelect.value;
    mainSelect.innerHTML = '<option value="">대분류 선택</option>';
    mainCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        mainSelect.appendChild(opt);
    });
    mainSelect.value = currentVal;
}

// 대분류 모달 제어
function openMainCategoryModal() {
    document.getElementById('mainCatModalTitle').textContent = "대분류 추가";
    document.getElementById('mainCategoryForm').reset();
    document.getElementById('editMainCatIndex').value = "";
    document.getElementById('mainCategoryModal').style.display = 'block';
}

function closeMainCategoryModal() {
    document.getElementById('mainCategoryModal').style.display = 'none';
}

function editMainCategory(index) {
    const cat = mainCategories[index];
    if (!cat) return;

    document.getElementById('mainCatModalTitle').textContent = "대분류 수정";
    document.getElementById('editMainCatIndex').value = index;
    document.getElementById('mainCatId').value = cat.id;
    document.getElementById('mainCatName').value = cat.name;
    document.getElementById('mainCatIcon').value = cat.icon || "";
    document.getElementById('mainCatColor').value = cat.color || "";
    document.getElementById('mainCatImage').value = cat.image || "";

    document.getElementById('mainCategoryModal').style.display = 'block';
}

async function saveMainCategory() {
    const index = document.getElementById('editMainCatIndex').value;
    const catData = {
        id: document.getElementById('mainCatId').value.trim(),
        name: document.getElementById('mainCatName').value.trim(),
        icon: document.getElementById('mainCatIcon').value.trim(),
        color: document.getElementById('mainCatColor').value.trim(),
        image: document.getElementById('mainCatImage').value.trim()
    };

    if (index === "") {
        // 추가
        mainCategories.push(catData);
    } else {
        // 수정
        mainCategories[parseInt(index)] = catData;
    }

    try {
        await db.collection("categories").doc("main").set({ list: mainCategories });
        alert("대분류가 저장되었습니다.");
        closeMainCategoryModal();
        renderAdminCategoryList();
    } catch (error) {
        alert("저장 실패: " + error);
    }
}

async function deleteMainCategory(index) {
    if (confirm("이 대분류를 삭제하시겠습니까? 연결된 중분류 데이터도 모두 삭제됩니다.")) {
        const catId = mainCategories[index].id;
        mainCategories.splice(index, 1);
        delete subCategories[catId]; // 연결된 중분류 삭제

        try {
            await db.collection("categories").doc("main").set({ list: mainCategories });
            await db.collection("categories").doc("sub").set({ data: subCategories });
            alert("삭제되었습니다.");
            renderAdminCategoryList();
        } catch (error) {
            alert("삭제 실패: " + error);
        }
    }
}

// 중분류 모달 제어
function openSubCategoryModal() {
    const parentSelect = document.getElementById('subCatParentId');
    parentSelect.innerHTML = '<option value="">대분류 선택</option>';
    mainCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        parentSelect.appendChild(opt);
    });

    document.getElementById('subCatModalTitle').textContent = "중분류 추가";
    document.getElementById('subCategoryForm').reset();
    document.getElementById('editSubCatMainId').value = "";
    document.getElementById('editSubCatIndex').value = "";
    document.getElementById('subCategoryModal').style.display = 'block';
}

function closeSubCategoryModal() {
    document.getElementById('subCategoryModal').style.display = 'none';
}

function editSubCategory(mainId, index) {
    if (!subCategories[mainId]) return;
    const sub = subCategories[mainId][index];
    if (!sub) return;

    openSubCategoryModal(); // Select 박스 선패치 위해 호출

    document.getElementById('subCatModalTitle').textContent = "중분류 수정";
    document.getElementById('editSubCatMainId').value = mainId;
    document.getElementById('editSubCatIndex').value = index;

    document.getElementById('subCatParentId').value = mainId;
    document.getElementById('subCatId').value = sub.id;
    document.getElementById('subCatName').value = sub.name;
    document.getElementById('subCatDesc').value = sub.description || "";
}

async function saveSubCategory() {
    const parentId = document.getElementById('subCatParentId').value;
    const oldMainId = document.getElementById('editSubCatMainId').value;
    const index = document.getElementById('editSubCatIndex').value;

    const subData = {
        id: document.getElementById('subCatId').value.trim(),
        name: document.getElementById('subCatName').value.trim(),
        description: document.getElementById('subCatDesc').value.trim()
    };

    if (!subCategories[parentId]) subCategories[parentId] = [];

    if (index === "") {
        // 추가
        subCategories[parentId].push(subData);
    } else {
        // 수정
        if (oldMainId !== parentId) {
            // 대분류가 바뀐 경우 이전 위치에서 삭제 후 새 위치에 추가
            if (subCategories[oldMainId]) {
                subCategories[oldMainId].splice(parseInt(index), 1);
            }
            subCategories[parentId].push(subData);
        } else {
            subCategories[parentId][parseInt(index)] = subData;
        }
    }

    try {
        await db.collection("categories").doc("sub").set({ data: subCategories });
        alert("중분류가 저장되었습니다.");
        closeSubCategoryModal();
        renderAdminCategoryList();
    } catch (error) {
        alert("저장 실패: " + error);
    }
}

async function deleteSubCategory(mainId, index) {
    if (confirm("이 중분류를 삭제하시겠습니까?")) {
        subCategories[mainId].splice(index, 1);
        try {
            await db.collection("categories").doc("sub").set({ data: subCategories });
            alert("삭제되었습니다.");
            renderAdminCategoryList();
        } catch (error) {
            alert("삭제 실패: " + error);
        }
    }
}

// 전역 공개 (HTML onclick 호출용)
window.editMainCategory = editMainCategory;
window.editSubCategory = editSubCategory;
window.deleteMainCategory = deleteMainCategory;
window.deleteSubCategory = deleteSubCategory;
window.openMainCategoryModal = openMainCategoryModal;
window.closeMainCategoryModal = closeMainCategoryModal;
window.openSubCategoryModal = openSubCategoryModal;
window.closeSubCategoryModal = closeSubCategoryModal;

// 창 바깥 클릭 시 모달 닫기
window.onclick = function (event) {
    const modals = {
        productModal: closeProductModal,
        answerModal: closeAnswerModal,
        checkInquiryModal: closeCheckModal,
        resourceModal: closeResourceModal,
        mainCategoryModal: closeMainCategoryModal,
        subCategoryModal: closeSubCategoryModal
    };

    for (const [id, closeFunc] of Object.entries(modals)) {
        const modal = document.getElementById(id);
        if (event.target === modal) {
            closeFunc();
        }
    }
}
