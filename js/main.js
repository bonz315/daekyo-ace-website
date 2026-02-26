// ==========================================
// 대교에이스 웹사이트 JavaScript
// ==========================================

// Firebase 설정 (필요한 경우에만 사용하도록 체크)
let mainFirestore;
if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        const firebaseConfig = {
            apiKey: "AIzaSyBvV3pOEkmxVpZi8DIj03tdVPHdVthvKjM",
            authDomain: "daekyoace.firebaseapp.com",
            projectId: "daekyoace",
            storageBucket: "daekyoace.firebasestorage.app",
            messagingSenderId: "694653024684",
            appId: "1:694653024684:web:4aac532c696f7ffd95e209",
            measurementId: "G-SGLNMD9P66"
        };
        firebase.initializeApp(firebaseConfig);
    }
    mainFirestore = firebase.firestore();
}

// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', async function () {
    // 카테고리 로드
    if (typeof loadCategories === 'function') {
        await loadCategories();
    }

    // 모바일 메뉴 토글
    initMobileMenu();

    // 홈 화면 주요 제품 슬라이더
    if (document.getElementById('recommendedProductSlider')) {
        if (typeof loadDBProducts === 'function') {
            await loadDBProducts();
        }
        initRecommendedSlider();
    }

    // 제품 필터링
    initProductFilters();

    // 자료실 필터링
    initResourceFilters();

    // 문의 폼 처리
    initContactForm();

    // 스크롤 애니메이션
    initScrollAnimations();
});

// ==========================================
// 모바일 메뉴
// ==========================================
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mainNav = document.getElementById('mainNav');

    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function () {
            mainNav.classList.toggle('mobile-active');

            // 아이콘 변경
            if (mainNav.classList.contains('mobile-active')) {
                mobileMenuBtn.textContent = '✕';
            } else {
                mobileMenuBtn.textContent = '☰';
            }
        });

        // 메뉴 항목 클릭 시 모바일 메뉴 닫기
        const navLinks = mainNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                if (window.innerWidth <= 768) {
                    mainNav.classList.remove('mobile-active');
                    mobileMenuBtn.textContent = '☰';
                }
            });
        });
    }
}

// ==========================================
// 제품 필터링
// ==========================================
function initProductFilters() {
    // 동적 제품 페이지(products.html)에서는 products.js가 필터링을 담당하므로 main.js의 필터링은 중지
    if (document.getElementById('productGrid')) return;

    const categoryBtns = document.querySelectorAll('.category-btn[data-category]');
    const subCategoryBtns = document.querySelectorAll('.category-btn[data-subcategory]');
    const detailCategoryBtns = document.querySelectorAll('.category-btn[data-detail]');
    const productCards = document.querySelectorAll('.product-card');
    const subCategoryDiv = document.getElementById('subCategory');
    const detailCategoryDiv = document.getElementById('detailCategory');
    const noProductsDiv = document.getElementById('noProducts');

    let selectedCategory = 'all';
    let selectedSubCategory = 'all';
    let selectedDetail = 'all';

    // 대분류 카테고리 필터
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // 활성 버튼 변경
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            selectedCategory = this.dataset.category;
            selectedSubCategory = 'all';
            selectedDetail = 'all';

            // 중분류 표시/숨김
            if (selectedCategory === 'wall-box') {
                if (subCategoryDiv) subCategoryDiv.style.display = 'flex';
            } else {
                if (subCategoryDiv) subCategoryDiv.style.display = 'none';
                if (detailCategoryDiv) detailCategoryDiv.style.display = 'none';
            }

            // 중분류, 소분류 버튼 초기화
            subCategoryBtns.forEach(b => b.classList.remove('active'));
            detailCategoryBtns.forEach(b => b.classList.remove('active'));

            filterProducts();
        });
    });

    // 중분류 카테고리 필터
    subCategoryBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            subCategoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            selectedSubCategory = this.dataset.subcategory;
            selectedDetail = 'all';

            // 소분류 표시
            if (selectedSubCategory === 'standard') {
                if (detailCategoryDiv) detailCategoryDiv.style.display = 'flex';
            } else {
                if (detailCategoryDiv) detailCategoryDiv.style.display = 'none';
            }

            detailCategoryBtns.forEach(b => b.classList.remove('active'));

            filterProducts();
        });
    });

    // 소분류 카테고리 필터
    detailCategoryBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            detailCategoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            selectedDetail = this.dataset.detail;

            filterProducts();
        });
    });

    // 제품 필터링 함수
    function filterProducts() {
        let visibleCount = 0;

        productCards.forEach(card => {
            const cardCategory = card.dataset.category;
            const cardSubCategory = card.dataset.subcategory;
            const cardDetail = card.dataset.detail;

            let shouldShow = true;

            // 대분류 필터
            if (selectedCategory !== 'all' && cardCategory !== selectedCategory) {
                shouldShow = false;
            }

            // 중분류 필터
            if (selectedSubCategory !== 'all' && cardSubCategory !== selectedSubCategory) {
                shouldShow = false;
            }

            // 소분류 필터
            if (selectedDetail !== 'all' && cardDetail !== selectedDetail) {
                shouldShow = false;
            }

            if (shouldShow) {
                card.style.display = 'block';
                visibleCount++;
                // 애니메이션 효과
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });

        // 제품이 없을 때 메시지 표시
        if (noProductsDiv) {
            if (visibleCount === 0) {
                noProductsDiv.style.display = 'block';
            } else {
                noProductsDiv.style.display = 'none';
            }
        }
    }

    // 초기 스타일 설정
    productCards.forEach(card => {
        card.style.transition = 'all 0.3s ease';
    });
}

// ==========================================
// 자료실 필터링
// ==========================================
function initResourceFilters() {
    const resourceTypeBtns = document.querySelectorAll('.category-btn[data-type]');
    const resourceItems = document.querySelectorAll('.resource-item[data-type]');

    if (resourceTypeBtns.length === 0) return;

    resourceTypeBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            // 활성 버튼 변경
            resourceTypeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const selectedType = this.dataset.type;

            // 자료 필터링
            resourceItems.forEach(item => {
                const itemType = item.dataset.type;

                if (selectedType === 'all' || itemType === selectedType) {
                    item.style.display = 'flex';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateX(0)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateX(-20px)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // 초기 스타일 설정
    resourceItems.forEach(item => {
        item.style.transition = 'all 0.3s ease';
    });
}

// ==========================================
// 문의 폼 처리 및 프라이빗 게시판 로직
// ==========================================
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const successMessage = document.getElementById('successMessage');
    const submitBtn = contactForm ? contactForm.querySelector('.submit-btn') : null;
    const emailInput = document.getElementById('email');

    if (emailInput) {
        // 이메일 유효성 검사 문구 커스텀
        emailInput.addEventListener('invalid', function () {
            this.setCustomValidity('올바른 메일주소를 입력해 주십시오.');
        });
        emailInput.addEventListener('input', function () {
            this.setCustomValidity('');
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!document.getElementById('privacy').checked) {
                alert('개인정보 수집 및 이용에 동의해주세요.');
                return;
            }

            // 전화번호 자동 포맷팅 적용 후 저장
            const rawPhone = document.getElementById('phone').value;
            const formattedPhone = formatPhoneNumber(rawPhone);

            const formData = {
                id: 'INQ' + Date.now(),
                name: document.getElementById('name').value,
                company: document.getElementById('company').value,
                email: document.getElementById('email').value,
                phone: formattedPhone,
                category: document.getElementById('category').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value,
                date: new Date().toLocaleString(),
                status: 'pending',
                answer: null
            };

            // 버튼 상태 변경
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = '문의 전송 중...';
            }

            // 1. EmailJS를 통해 실제 메일 발송
            emailjs.send("service_chviv7u", "template_c7t3yqs", formData)
                .then(function () {
                    console.log('Email Sent SUCCESS!');

                    // 2. Firebase Firestore에 저장 (진짜 DB)
                    const firestoreToUse = mainFirestore || (typeof db !== 'undefined' ? db : null);
                    if (firestoreToUse) {
                        return firestoreToUse.collection("inquiries").doc(formData.id).set(formData);
                    } else {
                        throw new Error("Firestore is not initialized.");
                    }
                })
                .then(function () {
                    // DB 저장 성공 시
                    contactForm.style.display = 'none';
                    successMessage.style.display = 'block';

                    setTimeout(() => {
                        contactForm.reset();
                        contactForm.style.display = 'block';
                        successMessage.style.display = 'none';
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.textContent = '문의하기';
                        }
                    }, 5000);
                })
                .catch(function (error) {
                    console.log('FAILED...', error);
                    alert('전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = '문의하기';
                    }
                });
        });
    }
}

// 고객의 내역 조회 기능
window.openCheckModal = function () {
    document.getElementById('checkInquiryModal').style.display = 'block';
    document.getElementById('checkInquiryStep1').style.display = 'block';
    document.getElementById('inquiryResultArea').style.display = 'none';
};

window.closeCheckModal = function () {
    document.getElementById('checkInquiryModal').style.display = 'none';
};

window.lookupInquiry = function () {
    const name = document.getElementById('checkName').value;
    const phoneInput = document.getElementById('checkPhone').value;

    if (!name || !phoneInput) {
        alert("이름과 연락처를 입력해주세요.");
        return;
    }

    // 조회 시에도 입력값의 하이픈 제거 후 매칭 정확도 향상
    const cleanedSearchPhone = phoneInput.replace(/\D/g, '');

    const resultArea = document.getElementById('inquiryResultArea');
    const step1 = document.getElementById('checkInquiryStep1');

    step1.style.display = 'none';
    resultArea.style.display = 'block';
    resultArea.innerHTML = '<p style="text-align:center; padding:2rem;">조회 중입니다...</p>';

    // Firebase Firestore에서 조회 (DB에는 이미 포맷팅되어 저장되어 있을 것이므로, 
    // 저장된 값을 불러온 후 한 번 더 포맷팅하여 비교하거나, 저장 단계에서 포맷팅을 통일하는 게 중요합니다.)
    db.collection("inquiries")
        .where("name", "==", name)
        .get()
        .then((querySnapshot) => {
            let results = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // DB의 전화번호와 입력한 전화번호에서 숫자만 추출하여 비교 (가장 확실함)
                const cleanedDbPhone = data.phone.replace(/\D/g, '');
                if (cleanedDbPhone === cleanedSearchPhone) {
                    results.push(data);
                }
            });

            // 날짜순 정렬 (최신순)
            results.sort((a, b) => new Date(b.date) - new Date(a.date));

            let html = `<h4 style="margin-bottom:1.5rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem;">총 ${results.length}건의 문의가 발견되었습니다.</h4>`;

            results.forEach(inq => {
                html += `
                    <div style="background:#f9f9f9; padding:1.5rem; border-radius:10px; margin-bottom:1.5rem; border:1px solid #eee;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <span style="font-weight:bold; color:var(--primary-orange);">${inq.category === 'product' ? '제품문의' : '일반문의'}</span>
                            <span style="font-size:0.85rem; color:#999;">접수: ${inq.date}</span>
                        </div>
                        <h5 style="font-size:1.1rem; margin-bottom:0.5rem;">Q. ${inq.subject}</h5>
                        <p style="font-size:0.95rem; color:#666; white-space:pre-wrap; margin-bottom:1rem; background:white; padding:1rem; border-radius:5px;">${inq.message}</p>
                        
                        ${inq.answer ? `
                            <div style="margin-top:1rem; padding:1rem; background:#fff3e0; border-left:4px solid var(--primary-orange); border-radius:5px;">
                                <strong style="display:block; margin-bottom:0.5rem;">📢 관리자 답변</strong>
                                <p style="font-size:0.95rem; line-height:1.6; white-space:pre-wrap;">${inq.answer}</p>
                            </div>
                        ` : `
                            <div style="text-align:center; padding:0.5rem; border:1px dashed #ccc; border-radius:5px; font-size:0.9rem; color:#999;">
                                답변 대기 중입니다.
                            </div>
                        `}
                    </div>
                `;
            });
            resultArea.innerHTML = html;
        })
        .catch((error) => {
            console.error("Error getting documents: ", error);
            resultArea.innerHTML = '<p style="text-align:center; color:red;">조회 시 오류가 발생했습니다. 관리자에게 문의바랍니다.</p>';
        });
};

// ==========================================
// 스크롤 애니메이션 (Reveal Effect)
// ==========================================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // CSS에 정의된 reveal 클래스들을 가진 모든 요소 감시
    const revealElements = document.querySelectorAll('[class*="reveal-"]');
    revealElements.forEach(el => observer.observe(el));
}

// ==========================================
// 유틸리티 함수
// ==========================================

// 부드러운 스크롤
function smoothScroll(target) {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// 페이지 상단으로 스크롤
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 이메일 유효성 검사
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 전화번호 포맷팅 (01012345678 -> 010-1234-5678)
function formatPhoneNumber(phone) {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, ''); // 숫자만 남기기
    let match;

    if (cleaned.length === 11) {
        // 휴대전화 (010-1234-5678)
        match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/);
        if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    } else if (cleaned.length === 10) {
        if (cleaned.startsWith('02')) {
            // 서울 지역번호 (02-1234-5678)
            match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
            if (match) return `${match[1]}-${match[2]}-${match[3]}`;
        } else {
            // 기타 지역번호 (031-123-4567)
            match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
            if (match) return `${match[1]}-${match[2]}-${match[3]}`;
        }
    } else if (cleaned.length === 9 && cleaned.startsWith('02')) {
        // 서울 지역번호 (02-123-4567)
        match = cleaned.match(/^(\d{2})(\d{3})(\d{4})$/);
        if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    }

    return phone; // 형식이 맞지 않으면 입력값 그대로 반환
}

// ==========================================
// 홈 화면 주요 제품 슬라이더 (무한 롤링)
// ==========================================
function initRecommendedSlider() {
    const sliderWrapper = document.getElementById('recommendedProductSlider');
    if (!sliderWrapper) return;

    // 1. 주요 제품만 필터링 (isRecommended === true)
    const featuredProducts = products.filter(p => p.isRecommended === true);

    if (featuredProducts.length === 0) {
        sliderWrapper.innerHTML = '<p style="text-align:center; width:100%; padding:2rem; color:#999;">등록된 주요 제품이 없습니다.</p>';
        sliderWrapper.style.animation = 'none';
        return;
    }

    // 2. 카드 렌더링 함수
    const createCardHTML = (p) => `
        <div class="slider-item">
            <div class="card" onclick="location.href='product-detail.html?id=${p.id}'" style="height: 100%;">
                <div class="card-image" style="background-color: #ffffff; padding: 10px; height: 180px; display: flex; align-items: center; justify-content: center;">
                    <img src="${p.image}" alt="${p.name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
                <div class="card-content">
                    <h3 class="card-title">${p.name}</h3>
                    <p style="color: var(--dark-gray); margin-top: 0.5rem; font-size: 0.9rem;">
                        ${p.cardSize || (p.specs ? p.specs.size : "")}
                    </p>
                </div>
            </div>
        </div>
    `;

    // 3. 무한 롤링을 위해 아이템 목록을 2배로 생성
    const itemsHTML = featuredProducts.map(createCardHTML).join('');
    sliderWrapper.innerHTML = itemsHTML + itemsHTML;
}
window.smoothScroll = smoothScroll;
window.scrollToTop = scrollToTop;
