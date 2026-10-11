// This service accepts a page URL and an optional signed visitor marker only.
// Practice answers and the practice localStorage key are never read here.
const PAGE = 'https://allen826liu.github.io/chem/';
const API = 'https://bsz.iirose.cn/api';
const KEY = 'element-room-visit-id';
const visitors = document.getElementById('visitor-count');
const views = document.getElementById('visit-count');
const status = document.getElementById('visit-status');

function unavailable() {
  visitors.textContent = views.textContent = '—';
  status.textContent = '暂时无法读取统计，可以继续默写；稍后刷新页面重试。';
}

async function recordVisit() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const headers = { 'x-bsz-referer': PAGE };
    try {
      const marker = localStorage.getItem(KEY);
      if (marker && marker.length <= 4096) headers.Authorization = `Bearer ${marker}`;
    } catch { /* The service can still estimate visitors if storage is blocked. */ }
    const response = await fetch(API, {
      method: 'POST', headers, credentials: 'omit', referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Statistics unavailable');
    const result = await response.json();
    const { page_uv: unique, page_pv: total } = result.data || {};
    if (result.success !== true || !Number.isSafeInteger(unique) || unique < 0 ||
        !Number.isSafeInteger(total) || total < unique) throw new Error('Invalid statistics');
    visitors.textContent = unique.toLocaleString('zh-CN');
    views.textContent = total.toLocaleString('zh-CN');
    status.textContent = '统计已更新；刷新会增加访问次数，访问人数会尽量去重。';
    const marker = response.headers.get('Set-Bsz-Identity');
    try { if (marker && marker.length <= 4096) localStorage.setItem(KEY, marker); } catch {}
  } catch {
    unavailable();
  } finally {
    clearTimeout(timeout);
  }
}

// Previews and other hosts must never add visits to the public website.
if (location.origin === 'https://allen826liu.github.io' &&
    ['/chem/', '/chem/index.html'].includes(location.pathname)) {
  // Loading a background tab does not count until the page is actually visible.
  const start = () => {
    if (document.visibilityState !== 'visible') return;
    document.removeEventListener('visibilitychange', start);
    recordVisit();
  };
  document.addEventListener('visibilitychange', start);
  start();
} else {
  visitors.textContent = views.textContent = '—';
  status.textContent = '预览页面不计入正式网站的访问统计。';
}
