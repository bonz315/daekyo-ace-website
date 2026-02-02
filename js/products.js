// 제품 페이지 JavaScript

// 현재 선택된 카테고리 상태
let selectedMainCategory = null;
let selectedSubCategory = null;
let selectedDetailCategory = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function () {
    initializeProductPage();
});

// 제품 페이지 초기화
function initializeProductPage() {
    renderMainCategories();
    hideProductGrid();
    setupResetButton();

    // URL 파라미터 확인하여 자동 선택
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category');
    const subId = urlParams.get('sub');

    if (categoryId) {
        if (subId) {
            selectMainAndSubCategory(categoryId, subId, false);
        } else {
            selectMainCategory(categoryId, false);
        }
    }
}

// 제품 그리드 숨기기
function hideProductGrid() {
    const container = document.getElementById('productGrid');
    const noProductsMsg = document.getElementById('noProducts');
    if (container) container.style.display = 'none';
    if (noProductsMsg) noProductsMsg.style.display = 'none';
}

// 대분류 카테고리 카드 렌더링
function renderMainCategories() {
    const container = document.getElementById('mainCategoryCards');
    if (!container) return;

    container.innerHTML = '';

    mainCategories.forEach(category => {
        const subCats = getSubCategories(category.id);
        const card = document.createElement('div');
        card.className = 'card category-card';
        card.style.cursor = 'pointer';

        // 전체 카드 클릭 시 대분류 선택
        card.onclick = (e) => {
            // 중분류 아이템 클릭 시와 겹치지 않게 처리
            if (e.target.closest('.sub-cat-item')) return;

            // 모바일 환경 대응 (너비 768px 이하)
            if (window.innerWidth <= 768) {
                if (!card.classList.contains('active')) {
                    // 다른 열려있는 카드 닫기
                    document.querySelectorAll('.category-card.active').forEach(c => {
                        if (c !== card) c.classList.remove('active');
                    });
                    // 현재 카드 목록 펼치기
                    card.classList.add('active');
                    return; // 첫 클릭 시에는 페이지 이동 방지
                }
            }

            // PC 환경이거나 모바일에서 이미 활성화된 경우 페이지 이동
            selectMainCategory(category.id);
        };

        const subCatsHtml = subCats.map(sub => `
            <div class="sub-cat-item" onclick="event.stopPropagation(); selectMainAndSubCategory('${category.id}', '${sub.id}')">
                ${sub.name}
            </div>
        `).join('');

        card.innerHTML = `
            <div class="card-image" style="background-color: #ffffff; padding: 1rem;">
                <img src="${category.image}" alt="${category.name}" style="width: 100%; height: 100%; object-fit: contain;">
            </div>
            <div class="card-content">
                <h3 class="card-title">${category.name}</h3>
                <div class="sub-category-hover-list">
                    ${subCatsHtml}
                </div>
            </div>
        `;

        container.appendChild(card);
    });
}

// 대분류와 중분류 동시 선택 (호버 리스트용)
function selectMainAndSubCategory(mainId, subId, updateHistory = true) {
    selectedMainCategory = mainId;
    selectedSubCategory = subId;
    selectedDetailCategory = null;

    // URL 및 히스토리 업데이트
    if (updateHistory) {
        const newUrl = window.location.pathname + '?category=' + mainId + '&sub=' + subId;
        window.history.pushState({ categoryId: mainId, subId: subId }, '', newUrl);
    }

    // 경로 및 네비게이션 업데이트
    updateCategoryPath();
    renderSubCategories(mainId);
    renderDetailCategories(mainId, subId);

    // 제품 표시
    renderProducts();

    // UI 전환
    const mainCards = document.getElementById('mainCategoryCards');
    const categoryPath = document.getElementById('selectedCategoryPath');

    if (mainCards) mainCards.style.display = 'none';
    if (categoryPath) categoryPath.style.display = 'block';
}

// 대분류 선택
function selectMainCategory(categoryId, updateHistory = true) {
    selectedMainCategory = categoryId;
    selectedSubCategory = null; // 초기에는 전체 제품 표시
    selectedDetailCategory = null;

    // URL 업데이트 (뒤로가기 시 상태 유지용)
    if (updateHistory) {
        const newUrl = window.location.pathname + '?category=' + categoryId;
        window.history.pushState({ categoryId: categoryId }, '', newUrl);
    }

    // 카테고리 경로 표시
    updateCategoryPath();

    // 중분류 렌더링
    renderSubCategories(categoryId);

    // 소분류 숨기기
    const detailNav = document.getElementById('detailCategoryNav');
    if (detailNav) detailNav.style.display = 'none';

    // 제품 표시
    renderProducts();

    // 대분류 카드 숨기기
    document.getElementById('mainCategoryCards').style.display = 'none';
    document.getElementById('selectedCategoryPath').style.display = 'block';
}

// 브라우저 뒤로가기/앞으로가기 버튼 대응
window.addEventListener('popstate', function (event) {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category');

    if (categoryId) {
        selectMainCategory(categoryId, false);
    } else {
        // 카테고리 선택이 없는 초기 상태로 복구
        selectedMainCategory = null;
        document.getElementById('mainCategoryCards').style.display = 'grid';
        document.getElementById('selectedCategoryPath').style.display = 'none';
        document.getElementById('subCategoryNav').style.display = 'none';
        document.getElementById('detailCategoryNav').style.display = 'none';
        hideProductGrid();
    }
});

// 중분류 카테고리 렌더링
function renderSubCategories(mainCategoryId) {
    const container = document.getElementById('subCategoryNav');
    if (!container) return;

    const subCats = getSubCategories(mainCategoryId);

    if (subCats.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.innerHTML = '';
    container.style.display = 'flex';

    // '전체' 버튼 추가
    const allBtn = document.createElement('button');
    allBtn.className = 'category-btn' + (selectedSubCategory === null ? ' active' : '');
    allBtn.textContent = '전체';
    allBtn.onclick = () => selectSubCategory(null);
    container.appendChild(allBtn);

    subCats.forEach(subCat => {
        const button = document.createElement('button');
        button.className = 'category-btn' + (selectedSubCategory === subCat.id ? ' active' : '');
        button.textContent = subCat.name;
        button.onclick = () => selectSubCategory(subCat.id);
        container.appendChild(button);
    });
}

// 중분류 선택
function selectSubCategory(subCategoryId) {
    selectedSubCategory = subCategoryId;
    selectedDetailCategory = null;

    // 중분류 버튼 활성화 상태 업데이트를 위해 다시 렌더링
    renderSubCategories(selectedMainCategory);

    // 카테고리 경로 업데이트
    updateCategoryPath();

    // 소분류 렌더링
    renderDetailCategories(selectedMainCategory, subCategoryId);

    // 제품 표시
    renderProducts();
}

// 소분류 카테고리 렌더링
function renderDetailCategories(mainCategoryId, subCategoryId) {
    const container = document.getElementById('detailCategoryNav');
    if (!container) return;

    const detailCats = getDetailCategories(mainCategoryId, subCategoryId);

    if (detailCats.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.innerHTML = '';
    container.style.display = 'flex';

    detailCats.forEach(detailCat => {
        const button = document.createElement('button');
        button.className = 'category-btn' + (selectedDetailCategory === detailCat.id ? ' active' : '');
        button.textContent = detailCat.name;
        button.onclick = () => selectDetailCategory(detailCat.id);
        container.appendChild(button);
    });
}

// 소분류 선택
function selectDetailCategory(detailCategoryId) {
    selectedDetailCategory = detailCategoryId;

    // 소분류 버튼 활성화 상태 업데이트를 위해 다시 렌더링
    renderDetailCategories(selectedMainCategory, selectedSubCategory);

    // 카테고리 경로 업데이트
    updateCategoryPath();

    // 제품 표시
    renderProducts();
}

// 카테고리 경로 업데이트
function updateCategoryPath() {
    const pathElement = document.getElementById('categoryPath');
    if (!pathElement) return;

    let path = [];

    if (selectedMainCategory) {
        const mainCat = getMainCategory(selectedMainCategory);
        path.push(mainCat.name);
    }

    if (selectedSubCategory) {
        const subCats = getSubCategories(selectedMainCategory);
        const subCat = subCats.find(cat => cat.id === selectedSubCategory);
        if (subCat) path.push(subCat.name);
    }

    if (selectedDetailCategory) {
        const detailCats = getDetailCategories(selectedMainCategory, selectedSubCategory);
        const detailCat = detailCats.find(cat => cat.id === selectedDetailCategory);
        if (detailCat) path.push(detailCat.name);
    }

    pathElement.textContent = path.join(' > ');
}

// 제품 렌더링
function renderProducts() {
    const filteredProducts = getProductsByCategory(
        selectedMainCategory,
        selectedSubCategory,
        selectedDetailCategory
    );

    const container = document.getElementById('productGrid');
    const noProductsMsg = document.getElementById('noProducts');

    if (filteredProducts.length === 0) {
        container.style.display = 'none';
        noProductsMsg.style.display = 'block';
        return;
    }

    container.style.display = 'grid';
    noProductsMsg.style.display = 'none';
    container.innerHTML = '';

    filteredProducts.forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
}

// 모든 제품 렌더링 (초기 상태)
function renderAllProducts() {
    const container = document.getElementById('productGrid');
    if (!container) return;

    container.innerHTML = '';

    products.forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
}

// 제품 카드 생성
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'card product-card';
    card.style.cursor = 'pointer';
    card.onclick = () => location.href = `product-detail.html?id=${product.id}`;

    // 카테고리 색상 가져오기
    const mainCat = getMainCategory(product.mainCategory);
    const color = mainCat ? mainCat.color : '#FF8C00';

    // 이미지 또는 SVG 플레이스홀더
    let imageHTML = '';
    if (product.image) {
        imageHTML = `
            <div style="width: 100%; height: 100%; background-color: #ffffff; display: flex; align-items: center; justify-content: center; padding: 10px;">
                <img src="${product.image}" alt="${product.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
            </div>
        `;
    } else {
        // SVG 플레이스홀더
        imageHTML = `
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="20" width="80" height="80" rx="4" fill="${color}" opacity="0.2" />
                <rect x="30" y="30" width="60" height="60" rx="2" stroke="${color}" stroke-width="3" />
                <circle cx="45" cy="45" r="5" fill="${color}" />
                <circle cx="75" cy="45" r="5" fill="${color}" />
                <circle cx="45" cy="75" r="5" fill="${color}" />
                <circle cx="75" cy="75" r="5" fill="${color}" />
            </svg>
        `;
    }

    card.innerHTML = `
        <div class="card-image">
            ${imageHTML}
        </div>
        <div class="card-content">
            <h3 class="card-title">${product.name}</h3>
            ${product.specs && product.specs.size ? `
                <p style="color: var(--dark-gray); margin-top: 0.5rem; font-size: 0.9rem;">
                    규격: ${product.specs.size}
                </p>
            ` : ''}
        </div>
    `;

    return card;
}

// 초기화 버튼 설정
function setupResetButton() {
    const resetBtn = document.getElementById('resetCategory');
    if (!resetBtn) return;

    resetBtn.onclick = () => {
        // 이미 대분류가 선택된 상태라면, 중분류/소분류만 초기화하고 해당 대분류의 전체 제품을 보여줌
        if (selectedMainCategory) {
            selectedSubCategory = null;
            selectedDetailCategory = null;

            // 카테고리 경로 업데이트
            updateCategoryPath();

            // 중/소분류 내비게이션 업데이트 (선택 해제된 상태로)
            renderSubCategories(selectedMainCategory);
            document.getElementById('detailCategoryNav').style.display = 'none';

            // 제품 표시 (현재 대분류의 전체 제품)
            renderProducts();
        } else {
            // 그 외의 경우 (혹시 모르니) 전체 초기화
            selectedMainCategory = null;
            selectedSubCategory = null;
            selectedDetailCategory = null;

            window.history.pushState({}, '', window.location.pathname);
            document.getElementById('mainCategoryCards').style.display = 'grid';
            document.getElementById('selectedCategoryPath').style.display = 'none';
            document.getElementById('subCategoryNav').style.display = 'none';
            document.getElementById('detailCategoryNav').style.display = 'none';
            hideProductGrid();
        }
    };
}
