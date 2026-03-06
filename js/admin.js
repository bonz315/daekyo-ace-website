// ==========================================
// 관리자 페이지 Logic
// ==========================================

// Firebase 설정은 firebase-init.js에서 처리됩니다.

const ADMIN_PASSWORD = "daekyo123"; // 초기 비밀번호

// 제품 관리 목록용 필터 상태
let adminProductCategoryFilter = 'all';
let adminProductSearchKeyword = '';

// 중분류 관리용 대분류 필터 상태
let adminSubCatFilter = 'all';

// 자료실 관리용 유형 필터 상태
let adminResourceFilter = 'all';

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

                // 투명 배경 → 흰색 배경으로 자동 변환
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);

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
        renderAdminProductCategoryTabs(); // 카테고리 필터 탭 생성
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
                renderAdminProductCategoryTabs();
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

            // 탭 변경 시 페이지 최상단으로 이동 (고정 헤더/탭 정렬 확인용)
            window.scrollTo({ top: 0, behavior: 'smooth' });

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
        isRecommended: document.getElementById('prodIsRecommended').checked,
        mainCategory: document.getElementById('prodMainCat').value,
        subCategory: document.getElementById('prodSubCat').value,
        image: imageUrls[0] || "",
        images: imageUrls,
        cardSize: document.getElementById('prodCardSize').value,
        description: document.getElementById('prodDesc').value,
        specs: specs,
        updatedAt: new Date().toISOString(),
        isDB: true
        // sortOrder: 기존 값 유지 (수정 시) 또는 저장 후 별도 설정
    };

    // 기존 sortOrder 값이 있으면 유지
    const editingId = document.getElementById('editId').value;
    if (editingId) {
        db.collection("products").doc(editingId.toString()).get().then(doc => {
            if (doc.exists && doc.data().sortOrder !== undefined) {
                productData.sortOrder = doc.data().sortOrder;
            }
            db.collection("products").doc(id.toString()).set(productData)
                .then(() => {
                    alert("제품 정보가 저장되었습니다.");
                    closeProductModal();
                    renderAdminProductList();
                })
                .catch(err => alert("저장 실패: " + err));
        });
        return; // 비동기 처리로 이동
    }

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
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:1rem;">데이터 로딩 중...</td></tr>';

    // DB 데이터 가져오기
    db.collection("products").get().then((querySnapshot) => {
        tbody.innerHTML = '';

        // 1. DB 제품 먼저 추가
        const dbProducts = [];
        querySnapshot.forEach((doc) => {
            dbProducts.push(doc.data());
        });

        // 2. 고정 제품 데이터와 합치기 (ID 중복 시 DB 우선)
        let combinedProducts = [...dbProducts];
        products.forEach(p => {
            if (!dbProducts.find(dbP => dbP.id.toString() === p.id.toString())) {
                combinedProducts.push(p);
            }
        });

        // 3. 필터링 적용 (카테고리 및 검색어)
        if (adminProductCategoryFilter !== 'all') {
            combinedProducts = combinedProducts.filter(p => p.mainCategory === adminProductCategoryFilter);
        }

        if (adminProductSearchKeyword) {
            const kw = adminProductSearchKeyword.toLowerCase();
            combinedProducts = combinedProducts.filter(p =>
                p.name.toLowerCase().includes(kw) ||
                (p.id && p.id.toString().includes(kw))
            );
        }

        // 대분류/중분류별 + sortOrder 정렬
        const mainCatOrder = {};
        mainCategories.forEach((cat, idx) => { mainCatOrder[cat.id] = idx; });

        const subCatOrder = {};
        Object.keys(subCategories).forEach(mainId => {
            subCategories[mainId].forEach((sub, idx) => {
                subCatOrder[mainId + '/' + sub.id] = idx;
            });
        });

        combinedProducts.sort((a, b) => {
            const orderA = mainCatOrder[a.mainCategory] !== undefined ? mainCatOrder[a.mainCategory] : 999;
            const orderB = mainCatOrder[b.mainCategory] !== undefined ? mainCatOrder[b.mainCategory] : 999;
            if (orderA !== orderB) return orderA - orderB;
            const subOrderA = subCatOrder[a.mainCategory + '/' + a.subCategory] !== undefined ? subCatOrder[a.mainCategory + '/' + a.subCategory] : 999;
            const subOrderB = subCatOrder[b.mainCategory + '/' + b.subCategory] !== undefined ? subCatOrder[b.mainCategory + '/' + b.subCategory] : 999;
            if (subOrderA !== subOrderB) return subOrderA - subOrderB;
            // 같은 중분류 내에서는 sortOrder 기준, 없으면 ID 내림차순
            const soA = a.sortOrder !== undefined ? a.sortOrder : 99999;
            const soB = b.sortOrder !== undefined ? b.sortOrder : 99999;
            if (soA !== soB) return soA - soB;
            return b.id - a.id;
        });

        // 같은 중분류 그룹 내에서 인접 제품 인덱스를 파악 (▲/▼ 버튼용)
        // 동일 mainCategory+subCategory 목록
        const groupMap = {}; // key: mainCat/subCat → sorted product array
        combinedProducts.forEach(p => {
            const key = (p.mainCategory || '') + '/' + (p.subCategory || '');
            if (!groupMap[key]) groupMap[key] = [];
            groupMap[key].push(p);
        });

        if (combinedProducts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:#999;">검색 결과 또는 등록된 제품이 없습니다.</td></tr>';
            return;
        }

        // 제품 렌더링 (대분류/중분류별 그룹 헤더 + 순서 버튼)
        const showHeaders = !adminProductSearchKeyword;
        let lastMainCat = null;
        let lastSubCat = null;
        combinedProducts.forEach(p => {
            // 대분류 헤더
            if (showHeaders && adminProductCategoryFilter === 'all' && p.mainCategory !== lastMainCat) {
                lastMainCat = p.mainCategory;
                lastSubCat = null;
                const mainCat = getMainCategory(p.mainCategory);
                const mainName = mainCat ? mainCat.name : p.mainCategory;
                const mainColor = mainCat ? mainCat.color : '#888';
                const groupCount = combinedProducts.filter(pp => pp.mainCategory === p.mainCategory).length;

                const headerTr = document.createElement('tr');
                headerTr.innerHTML = `
                    <td colspan="7" style="background: ${mainColor}15; border-left: 4px solid ${mainColor}; padding: 0.7rem 1rem; font-weight: 700; color: ${mainColor};">
                        ${mainCat ? mainCat.icon || '' : ''} ${mainName}
                        <span style="font-weight:400; color:#999; margin-left:8px; font-size:0.85rem;">(${groupCount}개)</span>
                    </td>
                `;
                tbody.appendChild(headerTr);
            }

            // 중분류 헤더
            const subKey = (p.mainCategory || '') + '/' + (p.subCategory || '');
            if (showHeaders && p.subCategory && subKey !== lastSubCat) {
                lastSubCat = subKey;
                const subs = getSubCategories(p.mainCategory);
                const subCat = subs.find(s => s.id && s.id.toString() === (p.subCategory || '').toString());
                const subName = subCat ? subCat.name : p.subCategory || '';
                const mainCat = getMainCategory(p.mainCategory);
                const mainColor = mainCat ? mainCat.color : '#888';
                const subCount = combinedProducts.filter(pp => pp.mainCategory === p.mainCategory && pp.subCategory === p.subCategory).length;

                const subHeaderTr = document.createElement('tr');
                subHeaderTr.innerHTML = `
                    <td colspan="7" style="background: #f9f9f9; border-left: 3px solid ${mainColor}88; padding: 0.5rem 1rem 0.5rem 2rem; color: #555; font-size: 0.9rem;">
                        ┗ ${subName}
                        <span style="color:#aaa; margin-left:6px; font-size:0.8rem;">(${subCount}개)</span>
                    </td>
                `;
                tbody.appendChild(subHeaderTr);
            }

            // 같은 그룹 내 위치 파악 (순서 버튼용)
            const groupKey = (p.mainCategory || '') + '/' + (p.subCategory || '');
            const groupArr = groupMap[groupKey] || [];
            const posInGroup = groupArr.findIndex(gp => gp.id.toString() === p.id.toString());
            const isFirst = posInGroup === 0;
            const isLast = posInGroup === groupArr.length - 1;
            const prevProduct = isFirst ? null : groupArr[posInGroup - 1];
            const nextProduct = isLast ? null : groupArr[posInGroup + 1];

            const tr = document.createElement('tr');
            const isStatic = !p.isDB;

            // 순서 버튼 셀 (groupArr 클로저로 전달하기 위해 createElement 사용)
            const orderTd = document.createElement('td');
            orderTd.style.whiteSpace = 'nowrap';
            if (isStatic) {
                orderTd.innerHTML = '<span style="color:#ccc; font-size:0.75rem;">고정</span>';
            } else {
                const upBtn = document.createElement('button');
                upBtn.className = 'btn-sm';
                upBtn.title = '위로';
                upBtn.textContent = '▲';
                if (isFirst) { upBtn.disabled = true; upBtn.style.opacity = '0.3'; upBtn.style.cursor = 'default'; }
                upBtn.addEventListener('click', () => moveProduct(p.id, prevProduct ? prevProduct.id : '', -1, groupArr));

                const downBtn = document.createElement('button');
                downBtn.className = 'btn-sm';
                downBtn.title = '아래로';
                downBtn.textContent = '▼';
                if (isLast) { downBtn.disabled = true; downBtn.style.opacity = '0.3'; downBtn.style.cursor = 'default'; }
                downBtn.addEventListener('click', () => moveProduct(p.id, nextProduct ? nextProduct.id : '', 1, groupArr));

                orderTd.appendChild(upBtn);
                orderTd.appendChild(downBtn);
            }
            tr.appendChild(orderTd);

            // ⚠ tr.innerHTML += 대신 insertAdjacentHTML 사용 → orderTd의 이벤트 리스너 보존
            tr.insertAdjacentHTML('beforeend', `
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
            `);
            tbody.appendChild(tr);
        });
    });
}

// 제품 순서 변경 (같은 중분류 내 인덱스 기반으로 sortOrder 재계산)
// currentId: 이동할 제품 ID, adjacentId: 교환 대상 제품 ID, direction: -1(위) or 1(아래)
// groupArr: 같은 중분류 내 정렬된 제품 배열 (static 포함), 순서 변경 후 DB 제품만 일괄 업데이트
window.moveProduct = async function (currentId, adjacentId, direction, groupArr) {
    if (!adjacentId || adjacentId === 'null' || adjacentId === '') return;
    if (!groupArr || groupArr.length === 0) return;

    try {
        // 1. 그룹 배열에서 두 항목의 인덱스를 찾아 swap
        const curIdx = groupArr.findIndex(p => p.id.toString() === currentId.toString());
        const adjIdx = groupArr.findIndex(p => p.id.toString() === adjacentId.toString());
        if (curIdx === -1 || adjIdx === -1) return;

        // 배열 내에서 위치 교환
        const temp = groupArr[curIdx];
        groupArr[curIdx] = groupArr[adjIdx];
        groupArr[adjIdx] = temp;

        // 2. 교환된 순서를 기준으로 DB 제품에만 sortOrder를 일괄 저장 (static 제품 제외)
        const updates = [];
        groupArr.forEach((p, idx) => {
            if (p.isDB) { // DB 제품만 업데이트
                updates.push(
                    db.collection("products").doc(p.id.toString()).update({ sortOrder: idx })
                );
            }
        });

        await Promise.all(updates);
        renderAdminProductList();
    } catch (error) {
        alert("순서 변경 실패: " + error);
    }
};

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

    // 유형 필터 탭 렌더링
    renderAdminResourceFilterTabs();

    db.collection("resources").onSnapshot((querySnapshot) => {
        tbody.innerHTML = '';

        const allResources = [];
        querySnapshot.forEach((doc) => {
            allResources.push(doc.data());
        });

        // 필터링 적용
        let filtered = allResources;
        if (adminResourceFilter !== 'all') {
            filtered = filtered.filter(r => r.type === adminResourceFilter);
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:2rem; color:#999;">등록된 자료가 없습니다.</td></tr>';
            return;
        }

        // 유형별로 정렬
        const typeOrder = Object.keys(resourceTypes);
        filtered.sort((a, b) => {
            const oA = typeOrder.indexOf(a.type);
            const oB = typeOrder.indexOf(b.type);
            return (oA === -1 ? 999 : oA) - (oB === -1 ? 999 : oB);
        });

        // 그룹 헤더 + 렌더링
        const typeColors = { catalog: '#2196F3', tax: '#4CAF50', cert: '#FF9800', patent: '#9C27B0' };
        let lastType = null;
        filtered.forEach(res => {
            // 전체보기 모드일 때 그룹 헤더
            if (adminResourceFilter === 'all' && res.type !== lastType) {
                lastType = res.type;
                const typeName = resourceTypes[res.type] || res.type;
                const color = typeColors[res.type] || '#888';
                const count = filtered.filter(r => r.type === res.type).length;

                const headerTr = document.createElement('tr');
                headerTr.innerHTML = `
                    <td colspan="5" style="background: ${color}15; border-left: 4px solid ${color}; padding: 0.7rem 1rem; font-weight: 700; color: ${color};">
                        ${typeName}
                        <span style="font-weight:400; color:#999; margin-left:8px; font-size:0.85rem;">(${count}개)</span>
                    </td>
                `;
                tbody.appendChild(headerTr);
            }

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

function renderAdminResourceFilterTabs() {
    const container = document.getElementById('adminResourceFilterTabs');
    if (!container) return;

    const typeColors = { catalog: '#2196F3', tax: '#4CAF50', cert: '#FF9800', patent: '#9C27B0' };
    let html = `<button class="admin-sub-tab ${adminResourceFilter === 'all' ? 'active' : ''}" 
                        onclick="setAdminResourceFilter('all')">전체보기</button>`;

    Object.keys(resourceTypes).forEach(key => {
        html += `<button class="admin-sub-tab ${adminResourceFilter === key ? 'active' : ''}" 
                         onclick="setAdminResourceFilter('${key}')">${resourceTypes[key]}</button>`;
    });

    container.innerHTML = html;
}

window.setAdminResourceFilter = function (type) {
    adminResourceFilter = type;
    renderAdminResourceFilterTabs();
    renderAdminResourceListSync();
};

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
    document.getElementById('resourceModal').style.display = 'flex';
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

        document.getElementById('resourceModal').style.display = 'flex';
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
        document.getElementById('answerModal').style.display = 'flex';
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

    document.getElementById('productModal').style.display = 'flex';
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
            document.getElementById('specCert').value = p.specs.certification || "";
        } else {
            document.getElementById('specName').value = "";
            document.getElementById('specSize').value = "";
            document.getElementById('specMaterial').value = "";
            document.getElementById('specColor').value = "";
            document.getElementById('specCert').value = "";
        }

        document.getElementById('productModal').style.display = 'flex';
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

    mainList.innerHTML = '<tr><td colspan="7" style="text-align:center;">로딩 중...</td></tr>';
    subList.innerHTML = '<tr><td colspan="6" style="text-align:center;">로딩 중...</td></tr>';

    // 카테고리 로드 후 렌더링
    if (typeof loadCategories === 'function') {
        loadCategories().then(() => {
            // 대분류 렌더링
            mainList.innerHTML = '';
            mainCategories.forEach((cat, index) => {
                const tr = document.createElement('tr');
                const isFirst = index === 0;
                const isLast = index === mainCategories.length - 1;
                tr.innerHTML = `
                    <td style="white-space:nowrap;">
                        <button class="btn-sm" onclick="moveMainCategory(${index}, -1)" ${isFirst ? 'disabled style="opacity:0.3;cursor:default;"' : ''} title="위로">▲</button>
                        <button class="btn-sm" onclick="moveMainCategory(${index}, 1)" ${isLast ? 'disabled style="opacity:0.3;cursor:default;"' : ''} title="아래로">▼</button>
                    </td>
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
            // 중분류 필터 탭 렌더링
            renderAdminSubCatFilterTabs();

            // 중분류 렌더링
            renderFilteredSubCategories(subList);

            // 제품 등록용 대분류 선택창 및 필터 탭 업데이트
            updateProductMainCatSelect();
            renderAdminProductCategoryTabs();
        }).catch(err => {
            console.error("Error categories load/render:", err);
            mainList.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">카테고리를 불러올 수 없습니다.</td></tr>';
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

    // 이미지 프리뷰 초기화
    const preview = document.getElementById('mainCatPreview');
    if (preview) {
        preview.style.display = 'none';
        preview.querySelector('img').src = "";
    }

    document.getElementById('mainCategoryModal').style.display = 'flex';
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

    // 이미지 프리뷰 설정
    const preview = document.getElementById('mainCatPreview');
    if (preview && cat.image) {
        preview.style.display = 'block';
        preview.querySelector('img').src = cat.image;
    } else if (preview) {
        preview.style.display = 'none';
    }

    document.getElementById('mainCategoryModal').style.display = 'flex';
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
    document.getElementById('subCategoryModal').style.display = 'flex';
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

// ==========================================
// 중분류 대분류별 필터 기능
// ==========================================
function renderAdminSubCatFilterTabs() {
    const container = document.getElementById('adminSubCatFilterTabs');
    if (!container) return;

    let html = `<button class="admin-sub-tab ${adminSubCatFilter === 'all' ? 'active' : ''}" 
                        onclick="setAdminSubCatFilter('all')">전체보기</button>`;

    mainCategories.forEach(cat => {
        html += `<button class="admin-sub-tab ${adminSubCatFilter === cat.id ? 'active' : ''}" 
                         onclick="setAdminSubCatFilter('${cat.id}')">${cat.icon || ''} ${cat.name}</button>`;
    });

    container.innerHTML = html;
}

window.setAdminSubCatFilter = function (mainId) {
    adminSubCatFilter = mainId;
    renderAdminSubCatFilterTabs();

    const subList = document.getElementById('adminSubCategoryList');
    if (subList) renderFilteredSubCategories(subList);
};

function renderFilteredSubCategories(subList) {
    subList.innerHTML = '';

    // 표시할 대분류 키 목록
    const mainIds = adminSubCatFilter === 'all'
        ? Object.keys(subCategories)
        : [adminSubCatFilter];

    let hasAny = false;

    mainIds.forEach((mainId, groupIdx) => {
        const subs = subCategories[mainId];
        if (!subs || subs.length === 0) return;

        const mainCat = getMainCategory(mainId);
        const mainName = mainCat ? mainCat.name : mainId;
        const mainColor = mainCat ? mainCat.color : '#888';

        // 전체보기 모드일 때 대분류 그룹 구분용 헤더 행 삽입
        if (adminSubCatFilter === 'all') {
            const headerTr = document.createElement('tr');
            headerTr.innerHTML = `
                <td colspan="6" style="background: ${mainColor}15; border-left: 4px solid ${mainColor}; padding: 0.7rem 1rem; font-weight: 700; color: ${mainColor};">
                    ${mainCat ? mainCat.icon || '' : ''} ${mainName}
                    <span style="font-weight:400; color:#999; margin-left:8px; font-size:0.85rem;">(${subs.length}개)</span>
                </td>
            `;
            subList.appendChild(headerTr);
        }

        subs.forEach((sub, index) => {
            hasAny = true;
            const isFirst = index === 0;
            const isLast = index === subs.length - 1;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="white-space:nowrap;">
                    <button class="btn-sm" onclick="moveSubCategory('${mainId}', ${index}, -1)" ${isFirst ? 'disabled style="opacity:0.3;cursor:default;"' : ''} title="위로">▲</button>
                    <button class="btn-sm" onclick="moveSubCategory('${mainId}', ${index}, 1)" ${isLast ? 'disabled style="opacity:0.3;cursor:default;"' : ''} title="아래로">▼</button>
                </td>
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

    if (!hasAny) {
        subList.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:#999;">등록된 중분류가 없습니다.</td></tr>';
    }
}

// 제품 검색 핸들러
window.handleAdminProductSearch = function (event) {
    adminProductSearchKeyword = event.target.value;
    renderAdminProductList();
};

// 제품 카테고리 필터 서브탭 생성
function renderAdminProductCategoryTabs() {
    const container = document.getElementById('adminProductCategoryFilter');
    if (!container) return;

    // '전체' 버튼
    let html = `<button class="admin-sub-tab ${adminProductCategoryFilter === 'all' ? 'active' : ''}" 
                        onclick="setAdminProductCategoryFilter('all')">전체보기</button>`;

    // 각 대분류별 버튼
    mainCategories.forEach(cat => {
        html += `<button class="admin-sub-tab ${adminProductCategoryFilter === cat.id ? 'active' : ''}" 
                         onclick="setAdminProductCategoryFilter('${cat.id}')">${cat.name}</button>`;
    });

    container.innerHTML = html;
}

// 카테고리 필터 변경 핸들러
window.setAdminProductCategoryFilter = function (categoryId) {
    adminProductCategoryFilter = categoryId;
    renderAdminProductCategoryTabs();
    renderAdminProductList();
};

// 전역 공개 (HTML onclick 호출용)
window.editMainCategory = editMainCategory;
window.editSubCategory = editSubCategory;
window.deleteMainCategory = deleteMainCategory;
window.deleteSubCategory = deleteSubCategory;
window.openMainCategoryModal = openMainCategoryModal;
window.closeMainCategoryModal = closeMainCategoryModal;
window.openSubCategoryModal = openSubCategoryModal;
window.closeSubCategoryModal = closeSubCategoryModal;

// 대분류 순서 이동
window.moveMainCategory = async function (index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= mainCategories.length) return;

    // 배열 내 위치 스왑
    const temp = mainCategories[index];
    mainCategories[index] = mainCategories[newIndex];
    mainCategories[newIndex] = temp;

    try {
        await db.collection("categories").doc("main").set({ list: mainCategories });
        renderAdminCategoryList();
    } catch (error) {
        alert("순서 변경 실패: " + error);
    }
};

// 중분류 순서 이동
window.moveSubCategory = async function (mainId, index, direction) {
    const subs = subCategories[mainId];
    if (!subs) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= subs.length) return;

    // 배열 내 위치 스왑
    const temp = subs[index];
    subs[index] = subs[newIndex];
    subs[newIndex] = temp;

    try {
        await db.collection("categories").doc("sub").set({ data: subCategories });
        renderAdminCategoryList();
    } catch (error) {
        alert("순서 변경 실패: " + error);
    }
};

// 창 바깥 클릭 시 모달 닫기
window.onclick = function (event) {
    const modals = {
        productModal: closeProductModal,
        answerModal: closeAnswerModal,
        checkInquiryModal: closeCheckModal,
        resourceModal: closeResourceModal,
        mainCategoryModal: closeMainCategoryModal,
        subCategoryModal: closeSubCategoryModal,
        groupingModal: closeGroupingModal
    };

    for (const [id, closeFunc] of Object.entries(modals)) {
        const modal = document.getElementById(id);
        if (event.target === modal) {
            closeFunc();
        }
    }
}

// ==========================================
// 7. 그룹핑 규칙 관리 Logic
// ==========================================

let groupingRules = [];       // [ { id, subCat, mainCat, label, keyword, names:[], order } ]
let adminGroupingFilter = 'all';   // 현재 중분류 필터

// 탭 전환 시 그룹핑 탭 로드 연동 (initTabs 오버라이드 없이 이벤트 추가)
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.dataset.tab === 'grouping') {
                loadGroupingRules();
            }
        });
    });

    // 그룹핑 폼 제출
    const form = document.getElementById('groupingForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            saveGroupingRule();
        });
    }
});

// DB에서 그룹핑 규칙 불러오기
async function loadGroupingRules() {
    try {
        const snap = await db.collection('groupingRules').orderBy('order').get();
        groupingRules = [];
        snap.forEach(doc => groupingRules.push(doc.data()));
    } catch (e) {
        // orderBy 인덱스 없을 경우 fallback
        try {
            const snap2 = await db.collection('groupingRules').get();
            groupingRules = [];
            snap2.forEach(doc => groupingRules.push(doc.data()));
        } catch (e2) {
            console.error('groupingRules load error:', e2);
        }
    }
    renderGroupingFilterTabs();
    renderGroupingRuleList();
}

// 중분류 필터 탭 렌더링
function renderGroupingFilterTabs() {
    const container = document.getElementById('adminGroupingFilterTabs');
    if (!container) return;

    // 존재하는 중분류 ID 수집
    const subIds = [...new Set(groupingRules.map(r => r.subCat))];

    let html = `<button class="admin-sub-tab ${adminGroupingFilter === 'all' ? 'active' : ''}"
                    onclick="setGroupingFilter('all')">전체보기</button>`;

    subIds.forEach(subId => {
        // 중분류 이름 찾기
        let subName = subId;
        Object.values(subCategories).forEach(arr => {
            const found = arr.find(s => s.id === subId);
            if (found) subName = found.name;
        });
        html += `<button class="admin-sub-tab ${adminGroupingFilter === subId ? 'active' : ''}"
                     onclick="setGroupingFilter('${subId}')">${subName}</button>`;
    });

    container.innerHTML = html;
}

window.setGroupingFilter = function (subId) {
    adminGroupingFilter = subId;
    renderGroupingFilterTabs();
    renderGroupingRuleList();
};

// 규칙 목록 렌더링
function renderGroupingRuleList() {
    const container = document.getElementById('groupingRuleList');
    if (!container) return;

    const filtered = adminGroupingFilter === 'all'
        ? groupingRules
        : groupingRules.filter(r => r.subCat === adminGroupingFilter);

    if (filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#bbb; padding:3rem;">등록된 그룹핑 규칙이 없습니다.<br>오른쪽 상단 "+ 새 규칙 추가" 버튼을 눌러 추가하세요.</p>';
        return;
    }

    // 중분류별로 그룹
    const grouped = {};
    filtered.forEach(r => {
        if (!grouped[r.subCat]) grouped[r.subCat] = [];
        grouped[r.subCat].push(r);
    });

    let html = '';
    Object.entries(grouped).forEach(([subId, rules]) => {
        // 중분류 이름
        let subName = subId;
        let mainColor = '#FF8C00';
        Object.entries(subCategories).forEach(([mainId, arr]) => {
            const found = arr.find(s => s.id === subId);
            if (found) {
                subName = found.name;
                const mc = getMainCategory(mainId);
                if (mc) mainColor = mc.color;
            }
        });

        html += `
        <div style="margin-bottom:2rem;">
            <div style="padding:0.6rem 1rem; background:${mainColor}15; border-left:4px solid ${mainColor};
                        border-radius:0 8px 8px 0; font-weight:700; color:${mainColor}; margin-bottom:0.8rem;">
                ${subName} <span style="font-weight:400; color:#999; font-size:0.85rem;">(${rules.length}개 그룹)</span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1rem;">
        `;

        rules.sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(rule => {
            const namePreview = (rule.names || []).slice(0, 3).join(', ') +
                ((rule.names || []).length > 3 ? ` 외 ${rule.names.length - 3}개` : '');

            html += `
            <div style="border:1px solid #eee; border-radius:10px; padding:1.2rem; background:#fff;
                        box-shadow:0 2px 6px rgba(0,0,0,0.04);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                    <span style="font-weight:700; font-size:1.05rem; color:#333;">${rule.label}</span>
                    <span style="font-size:0.75rem; color:#bbb;">순서: ${rule.order || 0}</span>
                </div>
                ${rule.keyword
                    ? `<div style="margin-bottom:0.5rem;"><span style="background:#e3f2fd; color:#1976d2; font-size:0.8rem; padding:2px 8px; border-radius:4px;">키워드: "${rule.keyword}"</span></div>`
                    : `<div style="font-size:0.82rem; color:#666; margin-bottom:0.5rem; line-height:1.6;">${namePreview || '(목록 없음)'}</div>`
                }
                <div style="display:flex; gap:0.5rem; margin-top:0.8rem;">
                    <button class="btn-edit btn-sm" onclick="editGroupingRule('${rule.id}')">수정</button>
                    <button class="btn-delete btn-sm" onclick="deleteGroupingRule('${rule.id}')">삭제</button>
                </div>
            </div>`;
        });

        html += `</div></div>`;
    });

    container.innerHTML = html;
}

// 모달 열기
window.openGroupingModal = function () {
    document.getElementById('groupingModalTitle').textContent = '그룹핑 규칙 추가';
    document.getElementById('groupingForm').reset();
    document.getElementById('editGroupingId').value = '';
    document.getElementById('groupingOrder').value = groupingRules.length;

    // 대분류 select 채우기
    const mainSel = document.getElementById('groupingMainCat');
    mainSel.innerHTML = '<option value="">선택해주세요</option>';
    mainCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        mainSel.appendChild(opt);
    });
    document.getElementById('groupingSubCat').innerHTML = '<option value="">대분류를 먼저 선택하세요</option>';

    // 체크박스 영역 초기화
    document.getElementById('groupingCheckboxArea').innerHTML =
        '<p style="color:#bbb; font-size:0.9rem; text-align:center; margin:0.5rem 0;">위에서 중분류를 선택하면 제품 목록이 표시됩니다</p>';

    document.getElementById('groupingModal').style.display = 'flex';
};

window.closeGroupingModal = function () {
    document.getElementById('groupingModal').style.display = 'none';
};

// 대분류 변경 시 중분류 업데이트
window.updateGroupingSubSelect = function () {
    const mainId = document.getElementById('groupingMainCat').value;
    const subSel = document.getElementById('groupingSubCat');
    subSel.innerHTML = '<option value="">선택해주세요</option>';

    const subs = subCategories[mainId] || [];
    subs.forEach(sub => {
        const opt = document.createElement('option');
        opt.value = sub.id;
        opt.textContent = sub.name;
        subSel.appendChild(opt);
    });

    // 중분류가 바뀌면 체크박스 초기화
    document.getElementById('groupingCheckboxArea').innerHTML =
        '<p style="color:#bbb; font-size:0.9rem; text-align:center; margin:0.5rem 0;">중분류를 선택하면 제품 목록이 표시됩니다</p>';
};

// 중분류 변경 시 체크박스 목록 로드
window.loadGroupingProductCheckboxes = async function (preCheckedNames = []) {
    const subCatId = document.getElementById('groupingSubCat').value;
    const area = document.getElementById('groupingCheckboxArea');
    if (!subCatId) return;

    area.innerHTML = '<p style="color:#bbb; font-size:0.85rem; text-align:center; padding:0.5rem;">제품 목록 로딩 중...</p>';

    try {
        // DB + 로컬 제품 중 해당 중분류 필터
        const snap = await db.collection('products').get();
        const dbProds = [];
        snap.forEach(doc => {
            const d = doc.data();
            if (d.subCategory && d.subCategory.toString() === subCatId) dbProds.push(d);
        });

        // 로컬 정적 제품도 포함 (DB에 없는 것만)
        const localProds = (typeof products !== 'undefined' ? products : []).filter(p =>
            p.subCategory && p.subCategory.toString() === subCatId &&
            !dbProds.find(d => d.id.toString() === p.id.toString())
        );
        const allProds = [...dbProds, ...localProds];

        if (allProds.length === 0) {
            area.innerHTML = '<p style="color:#bbb; font-size:0.9rem; text-align:center; margin:0.5rem 0;">이 중분류에 등록된 제품이 없습니다</p>';
            return;
        }

        // 키워드 여부에 따라 비활성화 처리
        const hasKeyword = document.getElementById('groupingKeyword').value.trim() !== '';

        // 체크박스 렌더링
        let html = '';
        if (hasKeyword) {
            html += '<p style="color:#e67e22; font-size:0.82rem; margin-bottom:0.6rem;">⚠ 키워드 방식 사용 중 — 체크박스 선택은 무시됩니다.</p>';
        }
        html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.3rem 1rem;">';
        allProds.forEach(p => {
            const checked = preCheckedNames.includes(p.name) ? 'checked' : '';
            const disabled = hasKeyword ? 'disabled' : '';
            html += `
            <label style="display:flex; align-items:center; gap:0.4rem; font-size:0.88rem;
                          cursor:${hasKeyword ? 'not-allowed' : 'pointer'}; color:${hasKeyword ? '#bbb' : '#333'};
                          padding:0.25rem 0;">
                <input type="checkbox" class="grp-prod-cb" value="${p.name}"
                    ${checked} ${disabled}
                    style="width:15px; height:15px; cursor:${hasKeyword ? 'not-allowed' : 'pointer'}">
                ${p.name}
            </label>`;
        });
        html += '</div>';
        area.innerHTML = html;
    } catch (e) {
        area.innerHTML = `<p style="color:red; font-size:0.85rem;">제품 목록 로드 실패: ${e}</p>`;
    }
};

// 키워드 입력 시 체크박스 활성/비활성 토글
window.onGroupingKeywordInput = function () {
    const hasKeyword = document.getElementById('groupingKeyword').value.trim() !== '';
    const checkboxes = document.querySelectorAll('.grp-prod-cb');
    const area = document.getElementById('groupingCheckboxArea');

    // 경고 문구 처리
    let warn = area.querySelector('.keyword-warn');
    if (hasKeyword) {
        if (!warn) {
            warn = document.createElement('p');
            warn.className = 'keyword-warn';
            warn.style.cssText = 'color:#e67e22; font-size:0.82rem; margin-bottom:0.6rem;';
            warn.textContent = '⚠ 키워드 방식 사용 중 — 체크박스 선택은 무시됩니다.';
            area.prepend(warn);
        }
    } else {
        if (warn) warn.remove();
    }

    checkboxes.forEach(cb => {
        cb.disabled = hasKeyword;
        cb.closest('label').style.color = hasKeyword ? '#bbb' : '#333';
        cb.closest('label').style.cursor = hasKeyword ? 'not-allowed' : 'pointer';
    });
};

// 수정 모달 열기
window.editGroupingRule = function (id) {
    const rule = groupingRules.find(r => r.id === id);
    if (!rule) return;

    document.getElementById('groupingModalTitle').textContent = '그룹핑 규칙 수정';
    document.getElementById('editGroupingId').value = rule.id;
    document.getElementById('groupingLabel').value = rule.label || '';
    document.getElementById('groupingKeyword').value = rule.keyword || '';
    document.getElementById('groupingOrder').value = rule.order || 0;

    // 대분류 select 채우고 선택
    const mainSel = document.getElementById('groupingMainCat');
    mainSel.innerHTML = '<option value="">선택해주세요</option>';
    mainCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        mainSel.appendChild(opt);
    });
    mainSel.value = rule.mainCat || '';

    // 중분류 select 채우고 선택
    window.updateGroupingSubSelect();
    setTimeout(() => {
        const subSel = document.getElementById('groupingSubCat');
        subSel.value = rule.subCat || '';
        // 체크박스 로드 + 기존 체크 항목 복원
        window.loadGroupingProductCheckboxes(rule.names || []);
    }, 80);

    document.getElementById('groupingModal').style.display = 'flex';
};

// 저장
async function saveGroupingRule() {
    const id = document.getElementById('editGroupingId').value || 'GRP' + Date.now();

    // 체크박스에서 선택된 제품명 수집 (키워드 없을 때만)
    const keyword = document.getElementById('groupingKeyword').value.trim();
    let names = [];
    if (!keyword) {
        document.querySelectorAll('.grp-prod-cb:checked').forEach(cb => {
            names.push(cb.value);
        });
    }

    const data = {
        id,
        mainCat: document.getElementById('groupingMainCat').value,
        subCat: document.getElementById('groupingSubCat').value,
        label: document.getElementById('groupingLabel').value.trim(),
        keyword,
        names,
        order: parseInt(document.getElementById('groupingOrder').value) || 0,
        updatedAt: new Date().toISOString()
    };

    if (!data.subCat) { alert('중분류를 선택해주세요.'); return; }
    if (!data.label) { alert('그룹 이름을 입력해주세요.'); return; }
    if (!data.keyword && data.names.length === 0) {
        alert('키워드를 입력하거나, 아래 목록에서 제품을 1개 이상 선택해주세요.');
        return;
    }

    try {
        await db.collection('groupingRules').doc(id).set(data);
        alert('저장되었습니다.');
        closeGroupingModal();
        loadGroupingRules();
    } catch (e) {
        alert('저장 실패: ' + e);
    }
}

// 삭제
window.deleteGroupingRule = async function (id) {
    if (!confirm('이 그룹핑 규칙을 삭제하시겠습니까?')) return;
    try {
        await db.collection('groupingRules').doc(id).delete();
        alert('삭제되었습니다.');
        loadGroupingRules();
    } catch (e) {
        alert('삭제 실패: ' + e);
    }
};

// ==========================================
// 기존 하드코딩 그룹핑 규칙 → DB 초기 등록 (시드)
// ==========================================
window.seedDefaultGroupingRules = async function () {
    if (!confirm('기존에 코드에 정의된 그룹핑 규칙을 DB에 등록합니다.\n이미 같은 ID의 규칙이 있으면 덮어씁니다.\n계속하시겠습니까?')) return;

    // ── 하드코딩된 기본 규칙 정의 ──
    const now = new Date().toISOString();
    const defaultRules = [
        // ─ 서포트&조절판 (masonry > support-plate) ─
        { id: 'GRP_support-plate_0', mainCat: 'masonry', subCat: 'support-plate', label: '써포트', keyword: '써포트', names: [], order: 0, updatedAt: now },
        { id: 'GRP_support-plate_1', mainCat: 'masonry', subCat: 'support-plate', label: '조절판', keyword: '조절판', names: [], order: 1, updatedAt: now },
        // ─ 8CB (slab > 8cb) ─
        { id: 'GRP_8cb_0', mainCat: 'slab', subCat: '8cb', label: '분리형', keyword: '', names: ['8CB 54', '8CB 54 22방출 일체형', '8CB 54 28방출 일체형', '8CB 75', '8CB 44'], order: 0, updatedAt: now },
        { id: 'GRP_8cb_1', mainCat: 'slab', subCat: '8cb', label: '데크', keyword: '데크', names: [], order: 1, updatedAt: now },
        { id: 'GRP_8cb_2', mainCat: 'slab', subCat: '8cb', label: '최상층', keyword: '최상층', names: [], order: 2, updatedAt: now },
        // ─ 4CB (slab > 4cb) ─
        { id: 'GRP_4cb_0', mainCat: 'slab', subCat: '4cb', label: '분리형', keyword: '', names: ['4CB 54', '4CB 54 22방출 일체형', '4CB 54 28방출 일체형', '4CB 75', '4CB 44'], order: 0, updatedAt: now },
        { id: 'GRP_4cb_1', mainCat: 'slab', subCat: '4cb', label: '데크', keyword: '데크', names: [], order: 1, updatedAt: now },
        { id: 'GRP_4cb_2', mainCat: 'slab', subCat: '4cb', label: '최상층', keyword: '최상층', names: [], order: 2, updatedAt: now }
    ];

    try {
        // db.batch() 대신 Promise.all로 개별 저장 (호환성 강화)
        await Promise.all(
            defaultRules.map(rule =>
                db.collection('groupingRules').doc(rule.id).set(rule)
            )
        );
        alert('✅ ' + defaultRules.length + '개의 기본 그룹핑 규칙이 DB에 등록되었습니다.');
        loadGroupingRules();
    } catch (e) {
        alert('등록 실패: ' + e);
    }
};
