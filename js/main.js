// ==========================================
// 대교에이스 웹사이트 JavaScript
// ==========================================

// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', function() {
    // 모바일 메뉴 토글
    initMobileMenu();
    
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
        mobileMenuBtn.addEventListener('click', function() {
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
            link.addEventListener('click', function() {
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
        btn.addEventListener('click', function() {
            // 활성 버튼 변경
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            selectedCategory = this.dataset.category;
            selectedSubCategory = 'all';
            selectedDetail = 'all';
            
            // 중분류 표시/숨김
            if (selectedCategory === 'wall-box') {
                subCategoryDiv.style.display = 'flex';
            } else {
                subCategoryDiv.style.display = 'none';
                detailCategoryDiv.style.display = 'none';
            }
            
            // 중분류, 소분류 버튼 초기화
            subCategoryBtns.forEach(b => b.classList.remove('active'));
            detailCategoryBtns.forEach(b => b.classList.remove('active'));
            
            filterProducts();
        });
    });
    
    // 중분류 카테고리 필터
    subCategoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            subCategoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            selectedSubCategory = this.dataset.subcategory;
            selectedDetail = 'all';
            
            // 소분류 표시
            if (selectedSubCategory === 'standard') {
                detailCategoryDiv.style.display = 'flex';
            } else {
                detailCategoryDiv.style.display = 'none';
            }
            
            detailCategoryBtns.forEach(b => b.classList.remove('active'));
            
            filterProducts();
        });
    });
    
    // 소분류 카테고리 필터
    detailCategoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
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
        btn.addEventListener('click', function() {
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
// 문의 폼 처리
// ==========================================
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const successMessage = document.getElementById('successMessage');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 폼 데이터 수집
            const formData = {
                name: document.getElementById('name').value,
                company: document.getElementById('company').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                category: document.getElementById('category').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value,
                privacy: document.getElementById('privacy').checked
            };
            
            // 유효성 검사
            if (!formData.privacy) {
                alert('개인정보 수집 및 이용에 동의해주세요.');
                return;
            }
            
            // 실제 서버로 전송하는 코드는 여기에 추가
            // 예: fetch('/api/contact', { method: 'POST', body: JSON.stringify(formData) })
            
            // 임시로 콘솔에 출력
            console.log('문의 내용:', formData);
            
            // 성공 메시지 표시
            contactForm.style.display = 'none';
            successMessage.style.display = 'block';
            
            // 3초 후 폼 초기화
            setTimeout(() => {
                contactForm.reset();
                contactForm.style.display = 'block';
                successMessage.style.display = 'none';
            }, 5000);
        });
    }
}

// ==========================================
// 스크롤 애니메이션
// ==========================================
function initScrollAnimations() {
    // Intersection Observer 설정
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // 애니메이션 대상 요소 선택
    const animateElements = document.querySelectorAll('.card, .timeline-item, .certificate-item');
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// fade-in 클래스 스타일 추가
const style = document.createElement('style');
style.textContent = `
    .fade-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

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

// 전화번호 포맷팅
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/);
    if (match) {
        return match[1] + '-' + match[2] + '-' + match[3];
    }
    return phone;
}

// ==========================================
// 전역 함수 (HTML에서 호출 가능)
// ==========================================
window.smoothScroll = smoothScroll;
window.scrollToTop = scrollToTop;
