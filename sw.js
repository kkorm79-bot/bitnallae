/* 빛날내 앱 설치용 — 화면 파일(같은 주소)만 인터넷 우선, 끊기면 저장본. 매출·재고 자료(구글 앱)는 건드리지 않음
 * 2026-11-12: 휴대폰 알림(웹 푸시) — 장터시스템 화면이 닫혀 있어도 새 글이 오면 상단바 알림. 누르면 그 화면으로 */
const C = "bn-shell-2";
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

/* ── 휴대폰 알림 ── 보내는 쪽: 구글 클라우드 컴퓨터 bitnallae-push. 내용 {t:제목, b:내용, k:종류(chat·visit·req·off·ntf), n:번호} */
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { try { d = { b: e.data.text() }; } catch (y) {} }
  const k = String(d.k || "ntf"), title = d.t || "빛날내 새 알림", base = self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    /* 화면을 보고 있는 중이면 화면이 알아서 띠링(알림 겹치지 않게) */
    const seen = list.find(c => c.visibilityState === "visible" && c.focused);
    if (seen && !d.test) { seen.postMessage({ bnPushSeen: { k } }); return; }
    return self.registration.showNotification(title, {
      body: d.b || "", tag: d.n ? "bn" + d.n : undefined, renotify: false,
      icon: base + "icon-192.png", badge: base + "icon-192.png", lang: "ko",
      vibrate: [180, 80, 180], timestamp: d.at || Date.now(),
      data: { k, url: base + "?n=" + k }
    });
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const dt = e.notification.data || {}, k = dt.k || "ntf", url = dt.url || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    const c = list.find(x => x.url.indexOf(self.registration.scope) === 0);
    if (c) { c.postMessage({ bnPush: { k } }); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
/* 폰이 알림 구독을 바꿨을 때(드묾): 다음에 화면을 열면 화면이 다시 등록함 */
self.addEventListener("pushsubscriptionchange", () => {});
