(function () {
  'use strict';
  var audio = document.getElementById('musica');
  var button = document.getElementById('btnMusica');
  var label = document.getElementById('musicLabel');
  var status = document.getElementById('musicStatus');
  var context, source, analyser, frequencies, waveform;
  var bass = 0, energy = 0, busy = false;
  audio.volume = 0.7;

  function reflectPlayback() {
    var playing = !audio.paused && !audio.ended;
    button.classList.toggle('playing', playing);
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
    label.textContent = playing ? 'Pausar música' : 'Toca para escuchar';
  }
  function connectAudio() {
    var AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine || context) return;
    context = new AudioEngine();
    analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.65;
    frequencies = new Uint8Array(analyser.frequencyBinCount);
    waveform = new Uint8Array(analyser.fftSize);
    source = context.createMediaElementSource(audio);
    source.connect(context.destination);
    source.connect(analyser);
  }
  button.addEventListener('click', async function () {
    if (busy) return;
    if (!audio.paused) { audio.pause(); return; }
    busy = true;
    button.disabled = true;
    status.textContent = 'Cargando música…';
    try {
      connectAudio();
      // Ambas llamadas nacen del toque para conservar el permiso de reproducción.
      var resume = context && context.state !== 'running' ? context.resume() : Promise.resolve();
      await Promise.all([resume, audio.play()]);
      status.textContent = '';
    } catch (error) {
      audio.pause();
      status.textContent = 'No se pudo reproducir. Toca para reintentar.';
    } finally {
      busy = false;
      button.disabled = false;
      reflectPlayback();
    }
  });
  audio.addEventListener('play', reflectPlayback);
  audio.addEventListener('pause', reflectPlayback);
  audio.addEventListener('ended', reflectPlayback);
  audio.addEventListener('error', function () {
    audio.pause();
    status.textContent = 'No se pudo cargar la canción. Toca para reintentar.';
    reflectPlayback();
  });

  window.FlowerAudio = {
    update: function (dt, reduced) {
      var targetBass = 0, targetEnergy = 0;
      if (analyser && context.state === 'running' && !audio.paused && !audio.ended) {
        analyser.getByteFrequencyData(frequencies);
        analyser.getByteTimeDomainData(waveform);
        var first = Math.max(1, Math.floor(40 * analyser.fftSize / context.sampleRate));
        var end = Math.min(frequencies.length, Math.ceil(250 * analyser.fftSize / context.sampleRate));
        for (var i = first; i < end; i++) targetBass += frequencies[i] / 255;
        targetBass /= Math.max(1, end - first);
        for (var j = 0; j < waveform.length; j++) {
          var amplitude = (waveform[j] - 128) / 128;
          targetEnergy += amplitude * amplitude;
        }
        targetEnergy = Math.min(1, Math.sqrt(targetEnergy / waveform.length) * 3);
        // El silencio no debe dejar una pulsaci?n residual del espectro suavizado.
        targetBass *= Math.min(1, targetEnergy * 5);
      }
      var smoothing = 1 - Math.exp(-Math.max(0, dt) * 18);
      bass += (targetBass - bass) * smoothing;
      energy += (targetEnergy - energy) * smoothing;
      var motion = reduced ? 0.2 : 1;
      button.style.setProperty('--music-scale', String(1 + energy * 0.12 * motion));
      return { bass: bass * motion, energy: energy * motion };
    },
    draw: function (ctx, x, y, radius, time, opacity, reduced) {
      if (energy < 0.005 || !waveform || reduced) return;
      ctx.save();
      ctx.lineWidth = 1.3;
      for (var ring = 0; ring < 3; ring++) {
        var phase = (time * 0.45 + ring / 3) % 1;
        var base = radius * (1.3 + phase * 2.5);
        ctx.globalAlpha = energy * (1 - phase) * 0.6 * opacity;
        ctx.strokeStyle = '#ffe89a';
        ctx.beginPath();
        for (var point = 0; point <= 128; point++) {
          var angle = point / 128 * Math.PI * 2;
          var sample = waveform[Math.floor((point % 128) / 128 * waveform.length)];
          var r = base + (sample - 128) / 128 * radius * 0.35;
          var px = x + Math.cos(angle) * r, py = y + Math.sin(angle) * r;
          if (point === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.stroke();
      }
      ctx.restore();
    }
  };
})();
