// 제품 상세 페이지 JavaScript

document.addEventListener('DOMContentLoaded', function () {
    initProductDetail();
});

function initProductDetail() {
    // URL에서 제품 ID 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));

    if (!productId) {
        alert('제품 정보를 찾을 수 없습니다.');
        location.href = 'products.html';
        return;
    }

    // 데이터베이스에서 제품 찾기
    const product = getProductById(productId);

    if (!product) {
        alert('해당 제품이 존재하지 않습니다.');
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

// 제품 이미지 렌더링
function renderProductImage(product) {
    const container = document.getElementById('productImageContainer');
    if (!container) return;

    if (product.image) {
        container.innerHTML = `
            <div style="width: 100%; height: 400px; background-color: #ffffff; border-radius: 12px; border: 1px solid var(--medium-gray); display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 20px;">
                <img src="${product.image}" alt="${product.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
            </div>
        `;
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

    // 설명
    if (descEl) {
        if (product.description && product.description !== '') {
            descEl.textContent = product.description;
            descEl.style.display = 'block';
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

    // 표시할 라벨 정의
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

    for (let key in product.specs) {
        const label = labels[key] || key;
        const value = product.specs[key];

        // 데이터가 '삭제'거나 null이 아닌 경우만 렌더링
        if (value && value !== '삭제') {
            html += `
                <div class="spec-item">
                    <span class="spec-label">${label}</span>
                    <span class="spec-value">${value}</span>
                </div>
            `;
        }
    }

    container.innerHTML = html;
}
