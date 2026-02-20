// ==========================================
// 대교에이스 웹사이트 JavaScript
// ==========================================

// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', function () {
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
        btn.addEventListener('click', function () {
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

    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!document.getElementById('privacy').checked) {
                alert('개인정보 수집 및 이용에 동의해주세요.');
                return;
            }

            const formData = {
                id: 'INQ' + Date.now(),
                name: document.getElementById('name').value,
                company: document.getElementById('company').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                category: document.getElementById('category').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value,
                date: new Date().toLocaleString(), // 더 정확한 시간 표시
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
                    // 성공 시
                    console.log('SUCCESS!', formData.id);

                    // 2. DB 대용으로 로컬스토리지에 저장 (기본 데이터 보존용)
                    const inquiries = JSON.parse(localStorage.getItem('daekyoInquiries') || '[]');
                    inquiries.push(formData);
                    localStorage.setItem('daekyoInquiries', JSON.stringify(inquiries));

                    // 성공 메시지 표시
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
                }, function (error) {
                    // 실패 시
                    console.log('FAILED...', error);
                    alert('알림 메일 전송에 실패했습니다. 하지만 문의 주신 내용은 시스템에 저장되었습니다. 잠시 후 다시 시도해주세요.');

                    // 실패해도 일단 로컬에는 저장 (고객의 문의는 소중하니까요)
                    const inquiries = JSON.parse(localStorage.getItem('daekyoInquiries') || '[]');
                    inquiries.push(formData);
                    localStorage.setItem('daekyoInquiries', JSON.stringify(inquiries));

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
    const phone = document.getElementById('checkPhone').value;

    if (!name || !phone) {
        alert("이름과 연락처를 입력해주세요.");
        return;
    }

    const inquiries = JSON.parse(localStorage.getItem('daekyoInquiries') || '[]');
    const results = inquiries.filter(inq => inq.name === name && inq.phone === phone);

    const resultArea = document.getElementById('inquiryResultArea');
    const step1 = document.getElementById('checkInquiryStep1');

    step1.style.display = 'none';
    resultArea.style.display = 'block';

    if (results.length === 0) {
        resultArea.innerHTML = `
            <div style="text-align:center; padding: 2rem;">
                <p style="color:#666;">등록된 문의 내역이 없습니다.</p>
                <button class="btn-outline" onclick="openCheckModal()" style="margin-top:1rem;">다시 시도</button>
            </div>`;
        return;
    }

    let html = `<h4 style="margin-bottom:1.5rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem;">총 ${results.length}건의 문의가 발견되었습니다.</h4>`;

    results.reverse().forEach(inq => {
        html += `
            <div style="background:#f9f9f9; padding:1.5rem; border-radius:10px; margin-bottom:1.5rem; border:1px solid #eee;">
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                    <span style="font-weight:bold; color:var(--primary-orange);">${inq.category === 'product' ? '제품문의' : '일반문의'}</span>
                    <span style="font-size:0.85rem; color:#999;">접수일: ${inq.date}</span>
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
