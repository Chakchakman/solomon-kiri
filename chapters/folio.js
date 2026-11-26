const reader = document.querySelector('#reader');
const pages = Array.from(reader.querySelectorAll('section'));
const back = document.querySelector('#back');
const next = document.querySelector('#next');
const menu = document.querySelector('#menu');
const contents = document.querySelector('#contents');
const count = document.querySelector('#count');
const links = document.querySelectorAll('a[href^="#"]');
let current = 0;

function show(index) {
  current = Math.max(0, Math.min(index, pages.length - 1));
  const active = pages[current];
  document.body.dataset.page = active.id;
  for (const page of pages) page.hidden = page !== active;
  for (const link of links) {
    if (link.hash === '#' + active.id) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  back.disabled = current === 0;
  next.disabled = current === pages.length - 1;
  count.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(pages.length).padStart(2, '0');
  reader.scrollTop = 0;
  reader.dispatchEvent(new Event('spreadchange'));
}
function fromHash() {
  show(pages.findIndex(page => '#' + page.id === location.hash));
}
if (window.parent !== window) {
  const parentURL = location.ancestorOrigins?.[0] || document.referrer;
  const host = /^https?:\/\//i.test(parentURL) ? new URL(parentURL).hostname : '';
  const forum = host === 'zamorie.com' || host.endsWith('.zamorie.com');
  const markedEmbed = !host && new URLSearchParams(location.search).get('embed') === 'forum';
  document.body.classList.toggle('forum-embed', forum || markedEmbed);
}
document.body.classList.add('ready');
fromHash();
window.addEventListener('hashchange', fromHash);
back.addEventListener('click', () => show(current - 1));
next.addEventListener('click', () => show(current + 1));
contents.addEventListener('click', () => menu.showModal());
for (const link of links) {
  link.addEventListener('click', event => {
    event.preventDefault();
    if (menu.open) menu.close();
    show(pages.findIndex(page => '#' + page.id === link.hash));
  });
}
// Handle taps on chapter markers directly, including the tap after a touch swipe.
const markers = document.querySelector('footer nav');
let markerTouch;
markers.addEventListener('touchstart', event => {
  const finger = event.touches[0];
  markerTouch = event.touches.length === 1 ? [finger.clientX, finger.clientY] : null;
}, {passive:true});
markers.addEventListener('touchcancel', () => { markerTouch = null; });
markers.addEventListener('touchend', event => {
  const link = event.target.closest('a');
  const finger = event.changedTouches[0];
  if (markerTouch && link && event.cancelable &&
      Math.hypot(finger.clientX-markerTouch[0], finger.clientY-markerTouch[1]) < 10) {
    event.preventDefault();
    link.click();
  }
  markerTouch = null;
}, {passive:false});
document.addEventListener('keydown', event => {
  if (menu.open || event.target.matches('input[type="range"]') || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    show(current + (event.key === 'ArrowLeft' ? -1 : 1));
  }
});
