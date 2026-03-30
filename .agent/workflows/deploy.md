---
description: 대교에이스 홈페이지 코드 수정 후 배포 절차
---

## 배포 절차

### 1. 코드 수정
AI가 HTML / CSS / JS / rules 파일을 직접 수정한다.

### 2. 배포 명령 실행
수정한 파일 종류에 따라 아래 명령을 실행한다.

// turbo
#### HTML / CSS / JS 파일을 수정한 경우
```
cmd /c "firebase deploy --only hosting"
```
작업 디렉토리: `c:\Users\User\OneDrive\바탕 화면\daekyo-ace-website`

// turbo
#### firestore.rules 파일을 수정한 경우
```
cmd /c "firebase deploy --only firestore:rules"
```

// turbo
#### 둘 다 수정한 경우
```
cmd /c "firebase deploy --only hosting,firestore:rules"
```

### 3. 배포 완료 확인
터미널에 `Deploy complete!` 메시지가 출력되면 성공.

### 4. 사용자에게 안내
배포 완료 후 사용자에게 아래를 알려준다:
- 브라우저에서 `Ctrl+Shift+R` (강력 새로고침) 으로 변경사항 확인 가능
- 반영까지 1~2분 소요될 수 있음

---

## 주의사항
- Firebase Console에서 별도 작업이 필요한 경우 사용자에게 명확히 안내한다.
- `firebase login` 세션이 만료된 경우 사용자에게 터미널에서 `firebase login` 실행을 요청한다.
- `storage.rules` 변경은 Firebase Blaze 플랜이 필요하므로 현재 사용하지 않는다.
