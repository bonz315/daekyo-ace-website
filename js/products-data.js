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

        console.log("Categories loaded from DB");
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

// 제품 데이터
let products = [
    {
        id: 1,
        name: '매입 스위치 (CSW1SS)',
        mainCategory: 'wall',
        subCategory: 'private',
        detailCategory: null,
        description: '',
        specs: {
            name: '민영 매입 스위치 (CSW1SS)',
            size: '62 X 102 X 85 (가로 X 세로 X 깊이)',
            material: '합성수지제',
            color: '블랙',
            certification: 'KS C 8436'
        },
        isRecommended: true,
        image: 'images/products/wall-switch-box.jpg'
    },
    {
        id: 6,
        name: '매입 사각 (4OB)',
        mainCategory: 'wall',
        subCategory: 'private',
        detailCategory: null,
        description: '',
        specs: {
            name: '민영 매입 사각 (4OB)',
            size: '102 X 102 X 85 (가로 X 세로 X 깊이)',
            material: '합성수지제',
            color: '블랙',
            certification: 'KS C 8436'
        },
        badge: null,
        isRecommended: true,
        image: 'images/products/4ob.jpg'
    },
    {
        id: 7,
        name: '매입 연용 (4OB 2G)',
        mainCategory: 'wall',
        subCategory: 'private',
        detailCategory: null,
        description: '',
        specs: {
            name: '민영 매입 연용 (4OB 2G)',
            size: '102 X 102 X 85 (가로 X 세로 X 깊이)',
            material: '합성수지제',
            color: '블랙',
            certification: 'KS C 8436'
        },
        badge: null,
        isRecommended: true,
        image: 'images/products/4ob-2g.png'
    },
    {
        id: 8,
        name: '매입 사각가로(4OB)',
        mainCategory: 'wall',
        subCategory: 'private',
        detailCategory: null,
        description: '',
        specs: {
            name: '민영 매입 사각가로(4OB)',
            size: '102 X 102 X 85 (가로 X 세로 X 깊이)',
            material: '합성수지제',
            color: '블랙',
            certification: 'KS C 8436'
        },
        badge: null,
        image: 'images/products/4ob-landscape.png'
    },
    {
        id: 100,
        name: '통합 월패드 박스',
        mainCategory: 'wallpad',
        subCategory: null,
        detailCategory: null,
        description: '현장 맞춤 제작 통합 월패드 박스',
        specs: {
            name: '통합 월패드 박스',
            size: '현장 맞춤 제작',
            material: '합성수지제 / 스틸',
            color: '화이트 / 그레이',
            certification: 'KC 인증 예정'
        },
        badge: '주문제작',
        image: 'images/category-wallpad.png'
    }
];

/**
 * DB에 등록된 제품들을 가져와서 기존 정적 리스트와 합칩니다.
 */
async function loadDBProducts() {
    try {
        const querySnapshot = await db.collection("products").get();
        querySnapshot.forEach((doc) => {
            const dbProd = doc.data();
            // 기존 정적 리스트에 있는 ID인 경우 교체, 없으면 추가
            const existingIndex = products.findIndex(p => p.id.toString() === dbProd.id.toString());
            if (existingIndex !== -1) {
                products[existingIndex] = dbProd;
            } else {
                products.push(dbProd);
            }
        });
        console.log("DB Products matched and loaded. Total:", products.length);
    } catch (error) {
        console.error("Error loading products from DB:", error);
    }
}

// 제품 검색 함수
function getProductsByCategory(mainCat, subCat = null, detailCat = null) {
    return products.filter(product => {
        if (mainCat && product.mainCategory !== mainCat) return false;
        if (subCat && product.subCategory !== subCat) return false;
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
