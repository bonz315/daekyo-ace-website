// 대교에이스 제품 데이터베이스

// 대분류 카테고리 (초기값, DB 로딩 실패 시 대비)
let mainCategories = [
    {
        id: 'wall',
        name: '벽체(매입)',
        icon: '🧱',
        color: '#FF8C00',
        image: 'images/category-wall.jpg'
    },
    {
        id: 'masonry',
        name: '조적,경량',
        icon: '🏗️',
        color: '#4A90E2',
        image: 'images/category-masonry.jpg'
    },
    {
        id: 'slab',
        name: '슬라브(천장,바닥)',
        icon: '📐',
        color: '#00A86B',
        image: 'images/category-slab.jpg'
    },
    {
        id: 'european',
        name: '단열부위',
        icon: '🌡️',
        color: '#9B59B6',
        image: 'images/category-insulation.jpg'
    },
    {
        id: 'wallpad',
        name: '통합 월패드',
        icon: '📱',
        color: '#E74C3C',
        image: 'images/category-wallpad.png'
    }
];

// 중분류 카테고리 (초기값)
let subCategories = {
    wall: [
        { id: 'private', name: '민영', description: '민영 벽체 제품' },
        { id: 'lh', name: 'LH', description: 'LH 벽체 제품' },
        { id: 'integrated', name: '통합박스', description: '통합박스 제품' },
        { id: 'insulation-connection', name: '단열부위&연결박스', description: '단열부위 및 연결박스' },
        { id: 'full-box', name: '풀박스', description: '풀박스 제품' },
        { id: 'terminal', name: '단자함', description: '단자함 제품' },
        { id: 'accessories', name: '기타 부속품', description: '기타 부속품' }
    ],
    slab: [
        { id: '8cb', name: '8CB', description: '8CB 슬라브 제품' },
        { id: '4cb', name: '4CB', description: '4CB 슬라브 제품' },
        { id: 'halo-pc', name: '할로코아,PC', description: '할로코아 및 PC 제품' },
        { id: 'slab-accessories', name: '슬라브 부속', description: '슬라브 부속품' }
    ],
    masonry: [
        { id: 'masonry-use', name: '조적용', description: '조적용 제품' },
        { id: 'flat-cover', name: '평커버', description: '평커버 제품' },
        { id: 'lightweight-use', name: '경량용', description: '경량용 제품' },
        { id: 'support-plate', name: '서포트&조절판', description: '서포트 및 조절판' }
    ],
    european: [
        { id: 'european-type', name: '단열용', description: '단열용 제품' }
    ],
    wallpad: [
        { id: 'wallpad', name: '월패드', description: '통합 월패드 제품' }
    ]
};

// 소분류 카테고리 (초기값)
let detailCategories = {
    // 향후 소분류가 필요한 경우 여기에 추가
};

// 그룹핑 규칙 (초기값: 비어있음 — DB에서 로드됨)
let groupingRulesDB = [];

/**
 * DB에서 카테고리 정보를 가져옵니다.
 */
async function loadCategories() {
    try {
        const mainDoc = await db.collection("categories").doc("main").get();
        if (mainDoc.exists) {
            mainCategories = mainDoc.data().list || mainCategories;
        }

        const subDoc = await db.collection("categories").doc("sub").get();
        if (subDoc.exists) {
            subCategories = subDoc.data().data || subCategories;
        }

        const detailDoc = await db.collection("categories").doc("detail").get();
        if (detailDoc.exists) {
            detailCategories = detailDoc.data().data || detailCategories;
        }

        // 그룹핑 규칙 로드
        try {
            const grpSnap = await db.collection("groupingRules").get();
            groupingRulesDB = [];
            grpSnap.forEach(doc => groupingRulesDB.push(doc.data()));
            // order 기준 정렬
            groupingRulesDB.sort((a, b) => (a.order || 0) - (b.order || 0));
        } catch (grpErr) {
            console.warn("groupingRules load skipped:", grpErr);
        }

        console.log("Categories loaded from DB");
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

/**
 * 특정 중분류(subCatId)의 그룹핑 규칙 목록을 반환합니다.
 * 규칙이 없으면 빈 배열 반환.
 */
function getGroupingRules(subCatId) {
    return groupingRulesDB.filter(r => r.subCat === subCatId);
}


// 제품 데이터
// ※ 모든 제품은 Firestore DB에서 loadDBProducts()를 통해 로드됩니다.
//    하드코딩된 기본 제품 데이터는 제거되었습니다.
//    (기존 고정 제품들은 Firestore products 컬렉션에 isDB:true로 등록되어 있음)
let products = [];

/**
 * DB에 등록된 제품들을 가져와서 기존 정적 리스트와 합칩니다.
 * - 첫 요청이 비어있으면(cold-start 타이밍 문제) 1.5초 후 1회 재시도
 */
async function loadDBProducts() {
    const mergeSnapshot = (querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const dbProd = doc.data();
            const existingIndex = products.findIndex(p => p.id.toString() === dbProd.id.toString());
            if (existingIndex !== -1) {
                products[existingIndex] = dbProd;
            } else {
                products.push(dbProd);
            }
        });
    };

    try {
        const querySnapshot = await db.collection("products").get();

        if (querySnapshot.empty) {
            // 첫 요청이 비어있음 → 퍼시스턴스 캐시 준비 전일 가능성
            // 1.5초 후 1회 재시도
            console.warn("[loadDBProducts] 첫 요청 빈 결과 → 1.5초 후 재시도...");
            await new Promise(resolve => setTimeout(resolve, 1500));
            const retrySnapshot = await db.collection("products").get();
            mergeSnapshot(retrySnapshot);
            console.log("[loadDBProducts] 재시도 완료. Total:", products.length);
        } else {
            mergeSnapshot(querySnapshot);
            console.log("DB Products matched and loaded. Total:", products.length);
        }

        // 전체 products 배열을 sortOrder 및 ID 내림차순(최신순)에 맞게 정렬
        products.sort((a, b) => {
            const soA = a.sortOrder !== undefined ? a.sortOrder : 99999;
            const soB = b.sortOrder !== undefined ? b.sortOrder : 99999;
            if (soA !== soB) return soA - soB;
            
            const idA = typeof a.id === 'string' ? Number(a.id.replace(/\D/g, '')) || 0 : a.id;
            const idB = typeof b.id === 'string' ? Number(b.id.replace(/\D/g, '')) || 0 : b.id;
            return idB - idA;
        });

    } catch (error) {
        console.error("Error loading products from DB:", error);
    }
}


// 제품 검색 함수
function getProductsByCategory(mainCat, subCat = null, detailCat = null) {
    return products.filter(product => {
        if (mainCat && product.mainCategory !== mainCat) return false;

        // 중분류 필터 (타입 캐스팅 고려)
        if (subCat) {
            const pSub = product.subCategory ? product.subCategory.toString() : "";
            const sSub = subCat.toString();
            if (pSub !== sSub) return false;
        }

        if (detailCat && product.detailCategory !== detailCat) return false;
        return true;
    });
}

// 카테고리 정보 가져오기
function getMainCategory(id) {
    return mainCategories.find(cat => cat.id === id);
}

function getSubCategories(mainCatId) {
    return subCategories[mainCatId] || [];
}

function getDetailCategories(mainCatId, subCatId) {
    const key = `${mainCatId}-${subCatId}`;
    return detailCategories[key] || [];
}

// 제품 상세 정보 가져오기
function getProductById(id) {
    if (!id) return null;
    return products.find(product => product.id.toString() === id.toString());
}
