// 제품 상세 페이지 JavaScript

document.addEventListener('DOMContentLoaded', async function () {
    if (typeof loadCategories === 'function') {
        await loadCategories();
    }
    if (typeof loadDBProducts === 'function') {
        await loadDBProducts();
    }
    initProductDetail();
});

async function initProductDetail() {
    // URL에서 제품 ID 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        alert('제품 ID가 URL에 없습니다.');
        location.href = 'products.html';
        return;
    }

    // 1. 먼저 로컬 데이터셋에서 찾기
    let product = getProductById(productId);

    // 2. 만약 없다면 DB에서 직접 1회성으로 다시 가져오기 시도
    if (!product) {
        console.log("Product not found in local array, trying direct DB fetch...");
        try {
            const doc = await db.collection("products").doc(productId.toString()).get();
            if (doc.exists) {
                product = doc.data();
                console.log("Product found via direct DB fetch:", product);
            }
        } catch (err) {
            console.error("Error during direct DB fetch:", err);
        }
    }

    if (!product) {
        alert('죄송합니다. 해당 제품 정보를 찾을 수 없습니다. (ID: ' + productId + ')');
        location.href = 'products.html';
        return;
    }

    // 페이지 제목 업데이트
    document.title = `${product.name} - (주)대교에이스`;

    // 브레드크럼 업데이트
    updateBreadcrumb(product);

    // 제품 이미지 렌더링
    renderProductImage(product);

    // 제품 기본 정보 렌더링
    renderProductBasicInfo(product);

    // 제품 사양 렌더링
    renderProductSpecs(product);
}

// 브레드크럼 업데이트
function updateBreadcrumb(product) {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (!breadcrumb) return;

    const mainCat = getMainCategory(product.mainCategory);
    const subCats = getSubCategories(product.mainCategory);
    const subCat = subCats.find(cat => cat.id === product.subCategory);

    let html = `
        <a href="index.html">홈</a>
        <span>&rsaquo;</span>
        <a href="products.html">제품</a>
        <span>&rsaquo;</span>
        <span>${mainCat ? mainCat.name : '알 수 없음'}</span>
    `;

    if (subCat) {
        html += `<span>&rsaquo;</span><span>${subCat.name}</span>`;
    }

    html += `<span>&rsaquo;</span><span>${product.name}</span>`;

    breadcrumb.innerHTML = html;
}

function renderProductImage(product) {
    const container = document.getElementById('productImageContainer');
    if (!container) return;

    // 이미지 배열 준비 (images 우선, 없으면 image 단일 항목)
    const images = product.images || (product.image ? [product.image] : []);

    if (images.length > 0) {
        // 메인 이미지 표시
        container.innerHTML = `<img src="${images[0]}" alt="${product.name}" id="mainProductImg">`;

        // 기존 썸네일 리스트 제거 (혹시 있다면)
        const oldList = document.querySelector('.product-thumb-list');
        if (oldList) oldList.remove();

        // 썸네일 리스트 추가 (이미지가 2장 이상일 때)
        if (images.length > 1) {
            const thumbList = document.createElement('div');
            thumbList.className = 'product-thumb-list';

            images.forEach((img, idx) => {
                const thumb = document.createElement('div');
                thumb.className = 'thumb-item' + (idx === 0 ? ' active' : '');

                thumb.innerHTML = `<img src="${img}" alt="${product.name} 썸네일 ${idx + 1}">`;

                thumb.onclick = () => {
                    // 메인 이미지 변경
                    const mainImg = document.getElementById('mainProductImg');
                    if (mainImg) mainImg.src = img;

                    // 활성 썸네일 표시 변경
                    document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                };

                thumbList.appendChild(thumb);
            });

            // 이미지 컨테이너 다음에 배치
            container.after(thumbList);
        }
    } else {
        const mainCat = getMainCategory(product.mainCategory);
        const color = mainCat ? mainCat.color : '#FF8C00';

        container.innerHTML = `
            <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="80" y="80" width="240" height="240" rx="12" fill="${color}" opacity="0.1" />
                <rect x="100" y="100" width="200" height="200" rx="8" stroke="${color}" stroke-width="6" />
                <text x="200" y="210" text-anchor="middle" fill="#666" font-size="20">이미지 준비중</text>
            </svg>
        `;
    }
}

// 제품 기본 정보 렌더링
function renderProductBasicInfo(product) {
    const badgeContainer = document.getElementById('productBadgeContainer');
    const nameEl = document.getElementById('productName');
    const descEl = document.getElementById('productDescription');

    // 배지
    if (badgeContainer) {
        if (product.badge) {
            badgeContainer.innerHTML = `<span class="card-badge">${product.badge}</span>`;
        } else {
            badgeContainer.innerHTML = '';
        }
    }

    // 이름
    if (nameEl) {
        // ID 1의 경우 "민영 벽체 스위치박스"로 표시하도록 데이터에서 가져옴 (getProductsById 활용)
        // 이미 데이터 업데이트 완료
        nameEl.textContent = product.specs.name || product.name;
    }

    // 설명 (기존 상단 설명 및 하단 상세 설명)
    if (descEl) {
        if (product.description && product.description !== '') {
            // 상단 요약 설명으로도 사용
            descEl.textContent = product.description.split('\n')[0]; // 첫 줄만 상단에 표시 (옵션)
            descEl.style.display = 'block';

            // 하단에 전체 상세 설명 표시
            const longDescSection = document.getElementById('longDescriptionSection');
            const longDescContent = document.getElementById('longDescriptionContent');
            if (longDescSection && longDescContent) {
                longDescContent.textContent = product.description;
                longDescSection.style.display = 'block';
            }
        } else {
            descEl.style.display = 'none';
        }
    }
}

// 제품 사양 렌더링
function renderProductSpecs(product) {
    const container = document.getElementById('specContainer');
    if (!container || !product.specs) return;

    let html = '';

    // 표시할 라벨 및 순서 정의
    const specOrder = ['name', 'model', 'size', 'material', 'color', 'temp', 'certification', 'packing'];
    const labels = {
        name: '제품명',
        model: '모델명',
        size: '규격',
        material: '재질',
        color: '색상',
        temp: '사용 온도',
        certification: '인증',
        packing: '포장 단위'
    };

    // 1. 정의된 순서대로 먼저 렌더링
    specOrder.forEach(key => {
        const label = labels[key];
        const value = product.specs[key];

        if (value && value !== '삭제' && value !== '') {
            html += `
                <div class="spec-item">
                    <span class="spec-label">${label}</span>
                    <span class="spec-value">${value}</span>
                </div>
            `;
        }
    });

    // 2. 혹시 순서 정의에 없는 나머지 키가 있다면 추가 렌더링
    for (let key in product.specs) {
        if (!specOrder.includes(key)) {
            const value = product.specs[key];
            if (value && value !== '삭제' && value !== '') {
                html += `
                <div class="spec-item">
                    <span class="spec-label">${key}</span>
                    <span class="spec-value">${value}</span>
                </div>
            `;
            }
        }
    }

    container.innerHTML = html;
}
