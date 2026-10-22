/**
 * ============================================================================
 * CENTRAL GAME STATE MANAGER
 * ============================================================================
 * Manages game transitions: BOOT, LOBBY, PLAYING_DASH, PLAYING_PARKING,
 * GARAGE, PAUSED, and RESULT.
 */

window.GameState = (function () {
  const STATES = {
    BOOT: 'BOOT',
    LOBBY: 'LOBBY',
    PLAYING_DASH: 'PLAYING_DASH',
    PLAYING_PARKING: 'PLAYING_PARKING',
    GARAGE: 'GARAGE',
    PAUSED: 'PAUSED',
    RESULT: 'RESULT'
  };

  let currentState = STATES.BOOT;
  let previousState = STATES.LOBBY;
  const listeners = [];

  function set(newState, params = {}) {
    if (newState === currentState) return;
    previousState = currentState;
    currentState = newState;
    console.log(`[GameState] Transition: ${previousState} -> ${currentState}`, params);

    listeners.forEach((fn) => {
      try {
        fn(currentState, previousState, params);
      } catch (e) {
        console.error('[GameState] Listener error:', e);
      }
    });
  }

  function get() {
    return currentState;
  }

  function getPrevious() {
    return previousState;
  }

  function isPlaying() {
    return currentState === STATES.PLAYING_DASH || currentState === STATES.PLAYING_PARKING;
  }

  function isPaused() {
    return currentState === STATES.PAUSED;
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  // Auto-pause when browser tab loses focus while playing
  window.addEventListener('visibilitychange', () => {
    if (document.hidden && isPlaying()) {
      set(STATES.PAUSED, { auto: true });
    }
  });

  window.addEventListener('blur', () => {
    if (isPlaying()) {
      set(STATES.PAUSED, { auto: true });
    }
  });

  return {
    STATES,
    set,
    get,
    getPrevious,
    isPlaying,
    isPaused,
    onChange
  };
})();
