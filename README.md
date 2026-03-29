# stmo — SillyTavern 모바일 편의 확장

모바일에서 SillyTavern을 더 편리하게 사용하기 위한 확장(Extension)입니다.

---

## 어떤 문제를 해결하나요?

모바일 브라우저에서 SillyTavern에 AI 답변을 요청한 뒤, 카카오톡·유튜브 등 다른 앱으로 전환하면 브라우저가 해당 탭을 **정지(suspend)** 시켜 응답이 표시되지 않는 문제가 발생합니다.

이 확장은 **Service Worker**를 이용해 탭이 정지되어 있어도 백그라운드에서 응답을 수신하고, 도착 시 **진동 + 푸시 알림**으로 사용자에게 알려줍니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 🔔 백그라운드 푸시 알림 | 탭이 숨겨져 있거나 다른 앱 사용 중에도 알림 표시 |
| 📳 진동 알림 | 답변 도착 시 진동 (Android Chrome 지원) |
| ⚙️ Service Worker | 탭이 정지되어도 백그라운드에서 API 응답 수신 |
| 🔒 Wake Lock | 화면이 켜진 동안 탭 정지 방지 |
| 📱 PWA 지원 | 홈 화면에 설치해 앱처럼 사용 가능 |

---

## 설치 방법

### 1. 확장 클론

SillyTavern의 서드파티 확장 디렉토리에 클론합니다:

```bash
cd SillyTavern/public/scripts/extensions/third-party/
# 리포지토리 이름은 'stmo'이지만, SillyTavern 확장 ID로 'mobile-notify' 폴더에 클론합니다
git clone https://github.com/pointhuh-netizen/stmo mobile-notify
```

### 2. SillyTavern 재시작

서버를 재시작하면 **Extensions** 메뉴에서 **Mobile Notify (모바일 알림)** 이 표시됩니다.

### 3. PWA manifest 연결 (선택 — iOS 알림에 필수)

SillyTavern의 메인 HTML 파일(`public/index.html`)의 `<head>` 안에 다음 한 줄을 추가합니다:

```html
<link rel="manifest" href="/scripts/extensions/third-party/mobile-notify/pwa-manifest.json">
```

또는 `pwa-manifest.json` 파일을 SillyTavern 루트의 `public/` 디렉토리에 복사한 뒤 아래와 같이 참조해도 됩니다:

```html
<link rel="manifest" href="/pwa-manifest.json">
```

---

## PWA 설치 방법 (홈 화면에 추가)

### iOS (Safari)

1. Safari에서 SillyTavern 접속
2. 하단 **공유** 버튼 (□↑) 탭
3. **"홈 화면에 추가"** 선택
4. 이름 확인 후 **추가**
5. 홈 화면에서 SillyTavern 아이콘으로 실행

> ⚠️ iOS 16.4 이상에서만 PWA 푸시 알림이 지원됩니다.

### Android (Chrome)

1. Chrome에서 SillyTavern 접속
2. 주소창 오른쪽 메뉴 (⋮) 탭
3. **"홈 화면에 추가"** 또는 **"앱 설치"** 선택
4. 설치 완료 후 홈 화면 아이콘으로 실행

---

## 플랫폼별 지원 현황

| 기능 | Android Chrome | iOS Safari (탭) | iOS PWA (홈 화면) |
|------|:-:|:-:|:-:|
| 진동 API | ✅ | ❌ | ❌ |
| 푸시 알림 | ✅ | ❌ | ✅ (iOS 16.4+) |
| Service Worker | ✅ | ✅ | ✅ |
| Wake Lock | ✅ | ❌ | ⚠️ 제한적 |
| 백그라운드 유지 | ✅ | ⚠️ 불안정 | ⚠️ 제한적 |

---

## 알려진 제한사항

- **iOS 진동 불가**: Apple 정책으로 진동 API가 지원되지 않습니다.
- **iOS 알림은 PWA 필수**: 홈 화면에 추가(PWA)하지 않으면 알림을 받을 수 없습니다.
- **iOS 버전 요구**: iOS 16.4 미만에서는 PWA 푸시 알림 미지원.
- **HTTPS 필요**: Service Worker와 알림은 HTTPS 또는 `localhost`에서만 작동합니다. 개인 서버는 SSL 인증서 설정이 필요합니다.
- **브라우저 권한**: 최초 실행 시 알림 권한 허용이 필요합니다.
- **SW 응답 삽입**: Service Worker에서 받은 응답을 SillyTavern 채팅 UI에 자동 삽입하려면 SillyTavern 내부 API와의 추가 연동이 필요할 수 있습니다.

---

## 파일 구조

```
mobile-notify/
├── manifest.json       # SillyTavern 확장 메타데이터
├── index.js            # 메인 확장 로직
├── sw.js               # Service Worker
├── pwa-manifest.json   # PWA 설치용 Web App Manifest
├── style.css           # 설정 UI 스타일
└── README.md           # 이 파일
```

---

## 라이선스

MIT
