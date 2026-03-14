const CACHE_NAME = 'daetag-v4';
const ASSETS = [
  '/daetag-ledger/',
  '/daetag-ledger/index.html',
  '/daetag-ledger/manifest.json',
  '/daetag-ledger/icon-192.png',
  '/daetag-ledger/icon-512.png',
];

// 설치 즉시 대기 없이 활성화
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting(); // 핵심: waiting 없이 바로 활성화
    })
  );
});

// 활성화 시 구버전 캐시 전부 삭제
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim(); // 핵심: 열린 탭 즉시 제어권 획득
    })
  );
});

// Network-first 전략: 항상 서버에서 먼저 가져오고, 실패 시 캐시
self.addEventListener('fetch', function(e) {
  // POST 등 비GET 요청은 무시
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request).then(function(response) {
      // 정상 응답이면 캐시에도 저장
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // 네트워크 실패 시 캐시에서 제공
      return caches.match(e.request);
    })
  );
});
