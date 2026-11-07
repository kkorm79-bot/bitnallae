/* 빛날내 앱 설치용 — 화면 파일(같은 주소)만 인터넷 우선, 끊기면 저장본. 매출·재고 자료(구글 앱)는 건드리지 않음 */
const C = "bn-shell-1";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(["./", "config.js", "bi.png", "icon-192.png"])).catch(() => {})); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  const home = r.mode === "navigate" && /\/(index\.html)?$/.test(u.pathname);
  const key = home ? "./" : r;
  e.respondWith(fetch(r).then(res => {
    if (res.ok && (home || /\.(js|png)$/.test(u.pathname))) { const cp = res.clone(); caches.open(C).then(c => c.put(key, cp)); }
    return res;
  }).catch(() => caches.match(key).then(m => m || (r.mode === "navigate" ? caches.match("./") : Response.error()))));
});
