(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const air = document.querySelectorAll('.air');
  const bell = document.querySelector('#temper-gear video');
  const panel = bell.closest('.panel');
  const visible = new Set();

  function active(element) {
    return !document.hidden && !reduced.matches && visible.has(element) &&
      !element.closest('section').hidden;
  }

  function stopBell() {
    bell.pause();
    bell.classList.remove('is-playing');
    if (bell.readyState && bell.currentTime) bell.currentTime = 0;
  }

  function update() {
    for (const layer of air) layer.classList.toggle('active', active(layer));
    if (!active(panel)) stopBell();
  }

  if (bell.canPlayType('video/webm; codecs="vp9"')) {
    panel.classList.add('motion-ready');
    panel.querySelector('button').addEventListener('click', () => {
      if (!active(panel)) return;
      if (!bell.hasAttribute('src')) bell.src = bell.dataset.src;
      bell.currentTime = 0;
      bell.play().catch(() => {
        if (bell.paused) bell.classList.remove('is-playing');
      });
    });
    bell.addEventListener('playing', () => {
      if (active(panel)) bell.classList.add('is-playing');
      else stopBell();
    });
    bell.addEventListener('ended', () => bell.classList.remove('is-playing'));
    bell.addEventListener('error', () => {
      stopBell();
      panel.classList.remove('motion-ready');
    });
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    update();
  });
  observer.observe(panel);
  air.forEach(layer => observer.observe(layer));
  document.querySelector('#reader').addEventListener('spreadchange', update);
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', update);
})();
