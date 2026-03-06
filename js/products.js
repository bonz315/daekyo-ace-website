// 제품 페이지 JavaScript

// 현재 선택된 카테고리 상태
let selectedMainCategory = null;
let selectedSubCategory = null;
let selectedDetailCategory = null;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function () {
    if (typeof loadCategories === 'function') {
        await loadCategories();
    }
    if (typeof loadDBProducts === 'function') {
        await loadDBProducts();
    }
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

            // 모바일 환경 대응 (너비 768px 이하) & 월패드 제외 (월패드는 바로 이동)
            if (window.innerWidth <= 768 && category.id !== 'wallpad') {
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

            // PC 환경이거나 모바일에서 이미 활성화된 경우 (또는 월패드인 경우) 페이지 이동
            selectMainCategory(category.id);
        };

        const subCatsHtml = (category.id === 'wallpad') ? '' : subCats.map(sub => `
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
                ${(category.id === 'wallpad') ? '' : `
                <div class="sub-category-hover-list">
                    ${subCatsHtml}
                </div>
                `}
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
    selectedDetailCategory = null;

    // 첫 번째 중분류 자동 선택 (전체 보기 없이)
    const subCats = getSubCategories(categoryId);
    if (subCats && subCats.length > 0 && categoryId !== 'wallpad') {
        selectedSubCategory = subCats[0].id;
    } else if (categoryId === 'wallpad') {
        // 월패드는 중분류 nav를 표시하지 않지만, 그룹핑 규칙 매칭을 위해 subCat id를 설정
        selectedSubCategory = subCats && subCats.length > 0 ? subCats[0].id : 'wallpad';
    } else {
        selectedSubCategory = null;
    }

    // URL 업데이트 (뒤로가기 시 상태 유지용)
    if (updateHistory) {
        let newUrl = window.location.pathname + '?category=' + categoryId;
        if (selectedSubCategory) newUrl += '&sub=' + selectedSubCategory;
        window.history.pushState({ categoryId: categoryId, subId: selectedSubCategory }, '', newUrl);
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

    if (subCats.length === 0 || mainCategoryId === 'wallpad') {
        container.style.display = 'none';
        return;
    }

    container.innerHTML = '';
    container.style.display = 'flex';

    // '전체' 버튼 없이 중분류만 표시
    subCats.forEach(subCat => {
        const button = document.createElement('button');
        const isActive = (selectedSubCategory && selectedSubCategory.toString() === subCat.id.toString());
        button.className = 'category-btn' + (isActive ? ' active' : '');
        button.textContent = subCat.name;
        button.onclick = (e) => {
            e.preventDefault();
            selectSubCategory(subCat.id);
        };
        container.appendChild(button);
    });
}

// 중분류 선택
function selectSubCategory(subCategoryId, updateHistory = true) {
    selectedSubCategory = subCategoryId;
    selectedDetailCategory = null;

    // URL 및 히스토리 업데이트
    if (updateHistory) {
        let newUrl = window.location.pathname + '?category=' + selectedMainCategory;
        if (subCategoryId) {
            newUrl += '&sub=' + subCategoryId;
        }
        window.history.pushState({ categoryId: selectedMainCategory, subId: subCategoryId }, '', newUrl);
    }

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

    // 안내 문구 표시 처리
    renderCategoryNotice(selectedMainCategory);
}

// 카테고리별 안내 문구 렌더링
function renderCategoryNotice(categoryId) {
    const noticeContainer = document.getElementById('categoryNotice');
    if (!noticeContainer) return;

    if (categoryId === 'wallpad') {
        noticeContainer.style.display = 'block';
        noticeContainer.innerHTML = `
            <div style="color: #e67e22; font-weight: 700; font-size: 1.25rem; margin-bottom: 1.5rem;">
                월패드를 발주하시기 전, 확인해주시기 바랍니다.
            </div>
            <div style="line-height: 2; color: #333;">
                <p style="margin-bottom: 0.5rem;">통합 월패드 박스는 전부 맞춤 제작입니다.</p>
                <p style="font-weight: 600; color: #d35400; margin-bottom: 1.5rem;">현장에 설치되는 스펙을 확인해주세요.</p>
                <div style="display: inline-block; text-align: left; background: #fff; padding: 1rem 1.5rem; border-radius: 8px; border: 1px dashed #ffd8a8;">
                    <span style="font-weight: 700; color: var(--primary-orange);">필요사항 :</span> 
                    월패드 브랜드와 모델명, 하부 네트워크스위치+온도조절기 배선기구 모양 및 스펙
                </div>
            </div>
        `;
    } else {
        noticeContainer.style.display = 'none';
        noticeContainer.innerHTML = '';
    }
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

    noProductsMsg.style.display = 'none';
    container.innerHTML = '';

    // ─── DB 그룹핑 규칙 우선 적용 (관리자에서 설정한 규칙이 있으면 여기서 처리 후 return) ───
    if (selectedSubCategory && selectedSubCategory !== 'integrated') {
        const dbRules = (typeof getGroupingRules === 'function')
            ? getGroupingRules(selectedSubCategory)
            : [];

        if (dbRules.length > 0) {
            container.style.display = 'block';
            container.style.gridTemplateColumns = '';
            container.classList.remove('product-grid-private');

            const color = '#FF8C00';
            const assigned = new Set();

            // 규칙에 따라 그룹 분류
            const groupBuckets = dbRules.map(rule => ({ rule, items: [] }));
            const otherBucket = { rule: { label: '기타' }, items: [] };

            filteredProducts.forEach(p => {
                const name = (p.name || '').trim();
                let matched = false;
                for (const bucket of groupBuckets) {
                    const r = bucket.rule;
                    if (r.keyword && name.includes(r.keyword)) {
                        bucket.items.push(p);
                        assigned.add(p.id);
                        matched = true;
                        break;
                    }
                    if (!r.keyword && Array.isArray(r.names) && r.names.includes(name)) {
                        bucket.items.push(p);
                        assigned.add(p.id);
                        matched = true;
                        break;
                    }
                }
                if (!matched) otherBucket.items.push(p);
            });

            // 그룹 렌더링 (제품이 있는 그룹만)
            const allBuckets = [...groupBuckets, otherBucket];
            allBuckets.forEach(bucket => {
                if (bucket.items.length === 0) return;

                const header = document.createElement('div');
                header.style.cssText = `
                    margin: 1.5rem 0 0.8rem 0;
                    padding: 0.5rem 1rem;
                    background: ${color}15;
                    border-left: 4px solid ${color};
                    border-radius: 0 8px 8px 0;
                    font-weight: 700;
                    font-size: 1rem;
                    color: ${color};
                    letter-spacing: 0.03em;
                `;
                header.textContent = bucket.rule.label;
                container.appendChild(header);

                const groupGrid = document.createElement('div');
                groupGrid.className = 'product-subgrid';
                bucket.items.forEach(product => {
                    const card = createProductCard(product);
                    groupGrid.appendChild(card);
                });
                container.appendChild(groupGrid);
            });

            return; // DB 규칙으로 처리 완료
        }
    }

    // ─── 통합박스(integrated): 제품명 접두어별 그룹핑 ───
    if (selectedSubCategory === 'integrated') {
        container.style.display = 'block';
        container.style.gridTemplateColumns = '';
        container.classList.remove('product-grid-private');

        // 접두어 추출: 영문자 + 연속된 숫자 1자리 (예: CSW3, CSW4, CSW5)
        function getPrefix(name) {
            const match = name.match(/^([A-Za-z가-힣]+\d)/);
            return match ? match[1].toUpperCase() : name.charAt(0).toUpperCase();
        }

        // 그룹 맵 생성 (순서 유지)
        const groupMap = new Map();
        filteredProducts.forEach(p => {
            const prefix = getPrefix(p.name);
            if (!groupMap.has(prefix)) groupMap.set(prefix, []);
            groupMap.get(prefix).push(p);
        });

        // 그룹별 렌더링
        const color = '#FF8C00'; // 그룹 헤더 색상: 브랜드 주황색 고정

        groupMap.forEach((products, prefix) => {
            // 그룹 헤더
            const header = document.createElement('div');
            header.style.cssText = `
                margin: 1.5rem 0 0.8rem 0;
                padding: 0.5rem 1rem;
                background: ${color}15;
                border-left: 4px solid ${color};
                border-radius: 0 8px 8px 0;
                font-weight: 700;
                font-size: 1rem;
                color: ${color};
                letter-spacing: 0.03em;
            `;
            header.textContent = prefix;
            container.appendChild(header);

            // 그룹 내 제품 그리드 (CSS 클래스로 반응형 처리)
            const groupGrid = document.createElement('div');
            groupGrid.className = 'product-subgrid';
            products.forEach(product => {
                const card = createProductCard(product);
                groupGrid.appendChild(card);
            });
            container.appendChild(groupGrid);
        });

        return;
    }

    // ─── 서포트&조절판(support-plate): 키워드별 그룹핑 ───
    if (selectedSubCategory === 'support-plate') {
        container.style.display = 'block';
        container.style.gridTemplateColumns = '';
        container.classList.remove('product-grid-private');

        const color = '#FF8C00'; // 그룹 헤더 색상: 브랜드 주황색 고정

        // 키워드 기반 그룹 분류 (순서 고정)
        const groups = [
            { key: '써포트', label: '써포트', products: [] },
            { key: '조절판', label: '조절판', products: [] },
            { key: '기타', label: '기타', products: [] }
        ];

        filteredProducts.forEach(p => {
            const name = p.name || '';
            if (name.includes('써포트') || name.includes('서포트')) {
                groups[0].products.push(p);
            } else if (name.includes('조절판')) {
                groups[1].products.push(p);
            } else {
                groups[2].products.push(p);
            }
        });

        // 제품이 있는 그룹만 렌더링
        groups.forEach(group => {
            if (group.products.length === 0) return;

            // 그룹 헤더
            const header = document.createElement('div');
            header.style.cssText = `
                margin: 1.5rem 0 0.8rem 0;
                padding: 0.5rem 1rem;
                background: ${color}15;
                border-left: 4px solid ${color};
                border-radius: 0 8px 8px 0;
                font-weight: 700;
                font-size: 1rem;
                color: ${color};
                letter-spacing: 0.03em;
            `;
            header.textContent = group.label;
            container.appendChild(header);

            // 그룹 내 제품 그리드
            const groupGrid = document.createElement('div');
            groupGrid.className = 'product-subgrid';
            group.products.forEach(product => {
                const card = createProductCard(product);
                groupGrid.appendChild(card);
            });
            container.appendChild(groupGrid);
        });

        return;
    }

    // ─── 8CB(8cb): 분리형 / 데크 / 최상층 / 기타 그룹핑 ───
    if (selectedSubCategory === '8cb') {
        container.style.display = 'block';
        container.style.gridTemplateColumns = '';
        container.classList.remove('product-grid-private');

        const color = '#FF8C00'; // 그룹 헤더 색상: 브랜드 주황색 고정

        // 분리형에 해당하는 정확한 제품명 목록
        const separateTypeNames = ['8CB 54', '8CB 54 22방출 일체형', '8CB 54 28방출 일체형', '8CB 75', '8CB 44'];

        // 그룹 분류 (순서 고정)
        const groups = [
            { label: '분리형', products: [] },
            { label: '데크', products: [] },
            { label: '최상층', products: [] },
            { label: '기타', products: [] }
        ];

        filteredProducts.forEach(p => {
            const name = (p.name || '').trim();
            if (separateTypeNames.includes(name)) {
                groups[0].products.push(p);
            } else if (name.includes('데크')) {
                groups[1].products.push(p);
            } else if (name.includes('최상층')) {
                groups[2].products.push(p);
            } else {
                groups[3].products.push(p);
            }
        });

        // 제품이 있는 그룹만 렌더링
        groups.forEach(group => {
            if (group.products.length === 0) return;

            // 그룹 헤더
            const header = document.createElement('div');
            header.style.cssText = `
                margin: 1.5rem 0 0.8rem 0;
                padding: 0.5rem 1rem;
                background: ${color}15;
                border-left: 4px solid ${color};
                border-radius: 0 8px 8px 0;
                font-weight: 700;
                font-size: 1rem;
                color: ${color};
                letter-spacing: 0.03em;
            `;
            header.textContent = group.label;
            container.appendChild(header);

            // 그룹 내 제품 그리드
            const groupGrid = document.createElement('div');
            groupGrid.className = 'product-subgrid';
            group.products.forEach(product => {
                const card = createProductCard(product);
                groupGrid.appendChild(card);
            });
            container.appendChild(groupGrid);
        });

        return;
    }

    // ─── 4CB(4cb): 분리형 / 데크 / 최상층 / 기타 그룹핑 ───
    if (selectedSubCategory === '4cb') {
        container.style.display = 'block';
        container.style.gridTemplateColumns = '';
        container.classList.remove('product-grid-private');

        const color = '#FF8C00'; // 그룹 헤더 색상: 브랜드 주황색 고정

        // 분리형에 해당하는 정확한 제품명 목록
        const separateTypeNames = ['4CB 54', '4CB 54 22방출 일체형', '4CB 54 28방출 일체형', '4CB 75', '4CB 44'];

        // 그룹 분류 (순서 고정)
        const groups = [
            { label: '분리형', products: [] },
            { label: '데크', products: [] },
            { label: '최상층', products: [] },
            { label: '기타', products: [] }
        ];

        filteredProducts.forEach(p => {
            const name = (p.name || '').trim();
            if (separateTypeNames.includes(name)) {
                groups[0].products.push(p);
            } else if (name.includes('데크')) {
                groups[1].products.push(p);
            } else if (name.includes('최상층')) {
                groups[2].products.push(p);
            } else {
                groups[3].products.push(p);
            }
        });

        // 제품이 있는 그룹만 렌더링
        groups.forEach(group => {
            if (group.products.length === 0) return;

            // 그룹 헤더
            const header = document.createElement('div');
            header.style.cssText = `
                margin: 1.5rem 0 0.8rem 0;
                padding: 0.5rem 1rem;
                background: ${color}15;
                border-left: 4px solid ${color};
                border-radius: 0 8px 8px 0;
                font-weight: 700;
                font-size: 1rem;
                color: ${color};
                letter-spacing: 0.03em;
            `;
            header.textContent = group.label;
            container.appendChild(header);

            // 그룹 내 제품 그리드
            const groupGrid = document.createElement('div');
            groupGrid.className = 'product-subgrid';
            group.products.forEach(product => {
                const card = createProductCard(product);
                groupGrid.appendChild(card);
            });
            container.appendChild(groupGrid);
        });

        return;
    }

    // ─── 기타 중분류: 기존 방식 ───
    container.style.display = 'grid';

    // 민영(private): CSS 클래스로 4열 (모바일에선 미디어쿼리로 2열 전환)
    if (selectedSubCategory === 'private') {
        container.classList.add('product-grid-private');
    } else {
        container.classList.remove('product-grid-private');
    }

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
            ${(product.cardSize || (product.specs && product.specs.size)) ? `
                <p style="color: var(--dark-gray); margin-top: 0.5rem; font-size: 0.9rem;">
                    규격: ${product.cardSize || product.specs.size}
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
