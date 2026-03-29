import { eventSource, event_types } from '../../../../script.js';

const extensionName = 'mobile-notify';
const SW_PATH = '/scripts/extensions/third-party/mobile-notify/sw.js';
const VIBRATION_PATTERN = [200, 100, 400];

let wakeLock = null;
let lastNotifyTime = 0;
const NOTIFY_COOLDOWN_MS = 3000; // 3초 이내 중복 알림 방지

// ─── Service Worker 등록 ───────────────────────────────────────────────────────
async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.warn(`[${extensionName}] Service Worker를 지원하지 않는 브라우저입니다.`);
        return;
    }
    try {
        const reg = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
        console.log(`[${extensionName}] Service Worker 등록 완료:`, reg.scope);
        listenForSWMessages();
    } catch (err) {
        console.error(`[${extensionName}] Service Worker 등록 실패:`, err);
    }
}

// ─── Service Worker 메시지 수신 ───────────────────────────────────────────────
function listenForSWMessages() {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'AI_RESPONSE') {
            console.log(`[${extensionName}] SW에서 AI_RESPONSE 수신`);
            // SW가 백그라운드에서 응답을 받았을 때 처리
            // SillyTavern의 채팅 재로드 또는 상태 갱신 트리거
            if (document.visibilityState === 'visible') {
                // 탭이 이미 보이는 경우 SillyTavern이 자체적으로 처리
                console.log(`[${extensionName}] 탭이 활성 상태 – SillyTavern이 응답을 표시합니다.`);
            }
        }
    });
}

// ─── 알림 권한 요청 ────────────────────────────────────────────────────────────
async function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        console.log(`[${extensionName}] 알림 권한: ${result}`);
    }
}

// ─── Wake Lock ────────────────────────────────────────────────────────────────
async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log(`[${extensionName}] Wake Lock 활성화`);
        wakeLock.addEventListener('release', () => {
            console.log(`[${extensionName}] Wake Lock 해제됨`);
        });
    } catch (err) {
        console.warn(`[${extensionName}] Wake Lock 실패:`, err.message);
    }
}

// 탭이 다시 보이면 Wake Lock 재요청
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});

// ─── 답변 수신 핸들러 ──────────────────────────────────────────────────────────
function onMessageReceived() {
    // MESSAGE_RECEIVED와 GENERATION_ENDED가 동시에 발화할 수 있으므로 중복 방지
    const now = Date.now();
    if (now - lastNotifyTime < NOTIFY_COOLDOWN_MS) return;
    lastNotifyTime = now;

    // 1. 진동 (Android Chrome 지원)
    if ('vibrate' in navigator) {
        navigator.vibrate(VIBRATION_PATTERN);
        console.log(`[${extensionName}] 진동 알림 전송`);
    }

    // 2. 탭이 백그라운드에 있으면 푸시 알림
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        // Service Worker를 통한 알림 (더 안정적)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                title: 'SillyTavern',
                body: '새로운 답변이 도착했습니다! 💬',
            });
        } else {
            // Fallback: 직접 Notification 생성
            new Notification('SillyTavern', {
                body: '새로운 답변이 도착했습니다! 💬',
                icon: '/img/ai4.png',
                tag: 'st-response',
            });
        }
        console.log(`[${extensionName}] 푸시 알림 전송`);
    }
}

// ─── 확장 초기화 ───────────────────────────────────────────────────────────────
jQuery(async () => {
    console.log(`[${extensionName}] 확장 로드됨`);

    await registerServiceWorker();
    await requestNotificationPermission();
    await requestWakeLock();

    eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
    eventSource.on(event_types.GENERATION_ENDED, onMessageReceived);

    console.log(`[${extensionName}] 이벤트 리스너 등록 완료`);
});
