// ==========================================
// 자료실 데이터 관리
// ==========================================

const resources = [
    {
        id: 'RES1',
        type: 'catalog',
        title: '2025 대교에이스 카탈로그',
        description: '전체 제품 라인업 및 상세 스펙, 지명원 포함',
        fileInfo: 'PDF | 2025.01.28',
        fileUrl: 'files/daekyo_ace_catalog_2025.pdf'
    },
    {
        id: 'RES2',
        type: 'cert',
        title: 'KC 인증서 (전기용품안전인증)',
        description: '벽체박스 KC 인증서',
        fileInfo: 'PDF, 1.2MB | 유효기간: 2026.12.31',
        fileUrl: '#'
    },
    {
        id: 'RES3',
        type: 'cert',
        title: 'KS 인증서 (한국산업표준)',
        description: 'KS C 8321 인증서',
        fileInfo: 'PDF, 1.5MB | 유효기간: 2027.06.30',
        fileUrl: '#'
    }
];

// 자료실 타입 정의
const resourceTypes = {
    catalog: "카탈로그",
    cert: "인증서"
};
