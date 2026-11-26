// Each clip is fetched on first use. Still artwork and pagination work independently.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const films = [...document.querySelectorAll('.scene-film')];
  const panels = [...document.querySelectorAll('.panel')];
  const visible = new Set();
  const allowed = () => !reduced.matches && !document.hidden;
  const available = panel => allowed() && !panel.closest('section').hidden && visible.has(panel);

  function stop(film) {
    film.pause();
    film.classList.remove('is-playing');
    if (film.readyState > 0 && film.currentTime) film.currentTime = 0;
    const range = film.parentElement.querySelector('input');
    if (range) range.value = '0';
  }

  function update() {
    for (const panel of panels) {
      const active = available(panel);
      panel.querySelector('.air')?.classList.toggle('active', active);
      const film = panel.querySelector('video');
      if (film && !active) stop(film);
    }
  }

  function load(film) {
    if (!film.hasAttribute('src')) {
      film.preload = 'auto';
      film.src = film.dataset.src;
      film.load();
    }
  }

  for (const film of films) {
    const panel = film.parentElement;
    if (!film.canPlayType('video/webm; codecs="vp9"')) continue;
    panel.classList.add('motion-ready');
    film.addEventListener('error', () => {
      stop(film);
      panel.classList.remove('motion-ready');
    });
    const range = panel.querySelector('input');
    if (range) {
      let fetching = false;
      // A local blob remains seekable even when a static host serves no byte ranges.
      async function loadShade() {
        if (fetching || film.hasAttribute('src')) return;
        fetching = true;
        try {
          const response = await fetch(film.dataset.src);
          if (!response.ok) throw new Error(String(response.status));
          film.preload = 'auto';
          film.src = URL.createObjectURL(await response.blob());
          film.load();
        } catch {
          film.classList.remove('is-playing');
        } finally {
          fetching = false;
        }
      }
      const scrub = () => {
        if (!available(panel)) return;
        loadShade();
        if (Number.isFinite(film.duration)) {
          film.currentTime = Math.max(0, film.duration - 1/24) * Number(range.value) / 100;
        }
      };
      range.addEventListener('input', scrub);
      film.addEventListener('loadedmetadata', scrub);
      film.addEventListener('seeked', () => {
        film.classList.toggle('is-playing', available(panel) && range.value !== '0');
      });
      let pointer = null;
      function follow(event) {
        const rect = panel.getBoundingClientRect();
        range.value = String(100 * (event.clientX - rect.left) / rect.width);
        scrub();
      }
      panel.addEventListener('pointerdown', event => {
        if (event.button || !available(panel) || event.target.closest('label')) return;
        pointer = event.pointerId;
        panel.setPointerCapture(pointer);
        follow(event);
      });
      panel.addEventListener('pointermove', event => {
        if (event.pointerId === pointer) follow(event);
      });
      panel.addEventListener('lostpointercapture', () => { pointer = null; });
      continue;
    }

    const button = panel.querySelector('button');
    const finalScene = panel.closest('section').id === 'path';
    const play = () => {
      if (!available(panel)) return;
      load(film);
      film.currentTime = 0;
      film.play().catch(() => {
        if (film.paused) film.classList.remove('is-playing');
      });
    };
    film.addEventListener('playing', () => {
      if (available(panel)) film.classList.add('is-playing');
      else stop(film);
    });
    film.addEventListener('ended', () => {
      if (!finalScene) film.classList.remove('is-playing');
    });
    button.addEventListener('click', play);
    if (finalScene) {
      let start;
      button.addEventListener('touchstart', event => {
        const finger = event.touches[0];
        start = event.touches.length === 1 ? [finger.clientX, finger.clientY] : null;
      }, {passive:true});
      button.addEventListener('touchcancel', () => { start = null; });
      button.addEventListener('touchend', event => {
        const finger = event.changedTouches[0];
        if (start) {
          const dx = Math.abs(finger.clientX - start[0]);
          const dy = Math.abs(finger.clientY - start[1]);
          if (dx > 36 && dx > 1.5 * dy && event.cancelable) {
            event.preventDefault();
            play();
          }
        }
        start = null;
      }, {passive:false});
    }
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    update();
  });
  panels.forEach(panel => observer.observe(panel));
  document.querySelector('#reader').addEventListener('spreadchange', update);
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', update);
})();
