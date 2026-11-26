(() => {
  const audio = document.querySelector('#soundtrack');
  const player = document.querySelector('.soundtrack');
  const toggle = player.querySelector('.music-toggle');
  const journey = document.querySelector('.journey-music');
  const volume = document.querySelector('#volume');
  const status = player.querySelector('.music-error');
  let context;
  let gain;

  // Some touch browsers delegate element volume to the device. Use a gain node there.
  audio.volume = Number(volume.value) / 100;
  const needsGain = Math.abs(audio.volume - Number(volume.value) / 100) > 0.01;
  function setVolume() {
    const level = Number(volume.value) / 100;
    volume.setAttribute('aria-valuetext', volume.value + ' %');
    if (gain) gain.gain.setValueAtTime(level, context.currentTime);
    else if (!needsGain) audio.volume = level;
    audio.muted = level === 0;
  }

  function sync() {
    const playing = !audio.paused && !audio.ended;
    for (const button of [toggle, journey]) {
      button.querySelector('.play-icon').textContent = playing ? 'Ⅱ' : '▶';
      button.setAttribute('aria-label', (playing ? 'Приостановить' : 'Включить') + ' Woodkid — Run Boy Run');
    }
    journey.querySelector('.journey-label').textContent = playing ? 'На паузу' : 'В путь';
  }

  async function toggleMusic() {
    status.textContent = '';
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try {
      if (needsGain && !gain) {
        const AudioEngine = window.AudioContext || window.webkitAudioContext;
        if (AudioEngine) {
          context = new AudioEngine();
          gain = context.createGain();
          context.createMediaElementSource(audio).connect(gain).connect(context.destination);
          setVolume();
        }
      }
      if (context && context.state !== 'running') await context.resume();
      await audio.play();
    } catch (error) {
      if (error.name !== 'AbortError') status.textContent = 'Не удалось включить трек. Нажмите ещё раз.';
    }
    sync();
  }

  for (const event of ['play','pause','ended']) audio.addEventListener(event, sync);
  volume.addEventListener('input', setVolume);
  toggle.addEventListener('click', toggleMusic);
  journey.addEventListener('click', toggleMusic);
  player.hidden = false;
  journey.hidden = false;
  sync();
})();
