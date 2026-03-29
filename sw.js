// sw.js — SillyTavern Mobile Notify: Service Worker
// 백그라운드에서 AI API 요청을 대신 수행하고, 응답 도착 시 알림/진동을 제공합니다.

const CACHE_NAME = 'mobile-notify-v1';

// ─── 설치 & 활성화 ─────────────────────────────────────────────────────────────
// [수정됨] 기존 install 이벤트를 덮어씁니다.
self.addEventListener('install', (event) => {
    console.log('[SW] 설치 완료');
    // [신규 추가] 기본 페이지 캐싱 추가
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.add('/');
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] 활성화 완료');
    event.waitUntil(self.clients.claim());
});

// ─── 메인 페이지에서 오는 메시지 처리 ─────────────────────────────────────────
self.addEventListener('message', (event) => {
    const { type } = event.data || {};

    if (type === 'FETCH_RESPONSE') {
        // 메인 페이지가 탭 전환으로 정지되어도 SW가 대신 API 요청 수행
        event.waitUntil(fetchAIResponse(event.data.payload));
    }

    if (type === 'SHOW_NOTIFICATION') {
        // 메인 페이지 요청으로 알림 표시 (Service Worker 경유 → 더 안정적)
        event.waitUntil(
            self.registration.showNotification(event.data.title || 'SillyTavern', {
                body: event.data.body || '새로운 답변이 도착했습니다! 💬',
                icon: '/img/ai4.png',
                badge: '/img/ai4.png',
                tag: 'st-response',
                vibrate: [200, 100, 400],
                renotify: true,
            })
        );
    }
});

// ─── 백그라운드 API 요청 ───────────────────────────────────────────────────────
async function fetchAIResponse(payload) {
    if (!payload || !payload.url) return;

    try {
        const response = await fetch(payload.url, {
            method: payload.method || 'POST',
            headers: payload.headers || { 'Content-Type': 'application/json' },
            body: typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // 1. 답변 도착 → 푸시 알림 (탭이 정지되어 있어도 작동)
        await self.registration.showNotification('SillyTavern', {
            body: '답변이 도착했습니다! 💬',
            icon: '/img/ai4.png',
            badge: '/img/ai4.png',
            tag: 'st-response',
            vibrate: [200, 100, 400],
            renotify: true,
            data: { response: data },
        });

        // 2. 살아있는 탭에 응답 전달
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clients.forEach((client) => {
            client.postMessage({
                type: 'AI_RESPONSE',
                data: data,
            });
        });
    } catch (err) {
        console.error('[SW] API 요청 실패:', err);

        // 실패 시에도 탭에 알림
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        clients.forEach((client) => {
            client.postMessage({
                type: 'AI_RESPONSE_ERROR',
                error: err.message,
            });
        });
    }
}

// ─── 알림 클릭 핸들러 ─────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            // 이미 열려 있는 SillyTavern 탭이 있으면 포커스
            const origin = self.location.origin;
            const stClient = clients.find((c) => c.url.startsWith(origin));
            if (stClient) {
                return stClient.focus();
            }
            // 없으면 새 탭 열기
            return self.clients.openWindow('/');
        })
    );
});

// ─── 백그라운드 푸시 (Web Push Protocol, 선택적) ──────────────────────────────
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    event.waitUntil(
        self.registration.showNotification(data.title || 'SillyTavern', {
            body: data.body || '새로운 답변이 도착했습니다! 💬',
            icon: '/img/ai4.png',
            badge: '/img/ai4.png',
            tag: 'st-response',
            vibrate: [200, 100, 400],
        })
    );
});

// ─── fetch 핸들러 (PWA 설치 조건 충족용 오프라인 강제 200 반환) ──────────────────────────────────────
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                // 오프라인 연결 실패 시 더미 HTML을 반환하여 Chrome의 PWA 검증을 강제로 통과시킴
                return new Response(
                    '<html><body><h2>SillyTavern Offline</h2></body></html>',
                    { headers: { 'Content-Type': 'text/html' } }
                );
            })
        );
    } else {
        event.respondWith(fetch(event.request));
    }
});
