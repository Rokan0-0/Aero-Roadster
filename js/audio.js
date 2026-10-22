/**
 * ============================================================================
 * PROCEDURAL WEB AUDIO SYNTHESIZER
 * ============================================================================
 * Zero-dependency Web Audio synthesizer generating dynamic electric motor whine,
 * cold-gas thruster hiss, stunt chimes, item collection, and crash impacts.
 */

window.SoundFX = (function () {
  let ctx = null;
  let isMuted = localStorage.getItem('tessa_roadshow_muted') === 'true';

  // Master Gain & Sub-Gains
  let masterGain = null;
  let engineOsc = null;
  let engineGain = null;
  let thrusterNode = null;
  let thrusterGain = null;
  let isInitialized = false;

  function initAudio() {
    if (isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      ctx = new AudioContext();

      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(isMuted ? 0 : 0.45, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // 1. Electric Motor Synth (Speed-Pitch Dependent)
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.setValueAtTime(55, ctx.currentTime);

      const engineFilter = ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.setValueAtTime(320, ctx.currentTime);

      engineGain = ctx.createGain();
      engineGain.gain.setValueAtTime(0.08, ctx.currentTime);

      engineOsc.connect(engineFilter);
      engineFilter.connect(engineGain);
      engineGain.connect(masterGain);
      engineOsc.start();

      // 2. Cold-Gas Thruster Noise Synth (White Noise + Bandpass)
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const thrusterFilter = ctx.createBiquadFilter();
      thrusterFilter.type = 'bandpass';
      thrusterFilter.frequency.setValueAtTime(800, ctx.currentTime);
      thrusterFilter.Q.setValueAtTime(1.8, ctx.currentTime);

      thrusterGain = ctx.createGain();
      thrusterGain.gain.setValueAtTime(0, ctx.currentTime);

      whiteNoise.connect(thrusterFilter);
      thrusterFilter.connect(thrusterGain);
      thrusterGain.connect(masterGain);
      whiteNoise.start();

      isInitialized = true;
    } catch (e) {
      console.warn('Web Audio initialization:', e);
    }
  }

  function ensureContext() {
    if (!ctx) initAudio();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  // Update dynamic engine and thruster volume
  function update(speed, isThrusting, isBoosting, dt) {
    if (!isInitialized || !ctx) return;

    // Pitch shift engine according to speed (50Hz idle to 240Hz at top speed)
    const normSpeed = Math.min(2.5, speed / 138);
    const targetFreq = 50 + normSpeed * 75;
    engineOsc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.08);

    // Thruster noise level
    const targetThrust = isBoosting ? 0.32 : (isThrusting ? 0.22 : 0);
    thrusterGain.gain.setTargetAtTime(targetThrust, ctx.currentTime, 0.05);
  }

  // Melodic Arpeggio on Stunts
  function playStuntChime() {
    if (!isInitialized || !ctx || isMuted) return;
    ensureContext();

    const notes = [440, 554.37, 659.25, 880]; // A major chord
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(ctx.currentTime + idx * 0.05);
      osc.stop(ctx.currentTime + idx * 0.05 + 0.36);
    });
  }

  // Floating Item Pickup Tone
  function playItemPickup() {
    if (!isInitialized || !ctx || isMuted) return;
    ensureContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.18); // D6

    gain.gain.setValueAtTime(0.24, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  // Heavy Collision Crunch & Thud
  function playCrash() {
    if (!isInitialized || !ctx || isMuted) return;
    ensureContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  }

  // Toggle Mute
  function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('tessa_roadshow_muted', isMuted);
    if (masterGain && ctx) {
      masterGain.gain.setValueAtTime(isMuted ? 0 : 0.45, ctx.currentTime);
    }
    return isMuted;
  }

  // Unlock audio context on first user interaction
  window.addEventListener('pointerdown', ensureContext, { once: true });
  window.addEventListener('keydown', ensureContext, { once: true });

  return {
    init: initAudio,
    ensureContext,
    update,
    playStuntChime,
    playItemPickup,
    playCrash,
    toggleMute,
    isMuted: () => isMuted
  };
})();
