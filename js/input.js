/**
 * ============================================================================
 * INPUT & CONTROLS CONTROLLER
 * ============================================================================
 * Handles dual-thumb virtual joystick on mobile touchscreens, action buttons
 * with multi-touch pointer capture, and full keyboard control (WASD / Arrows).
 */

window.InputController = (function () {
  const input = {
    steerX: 0,
    pitchY: 0,
    boost: false,
    lift: false,
    slam: false
  };

  const keys = {};

  async function requestLandscapeFullscreen() {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape');
      }
    } catch (e) {
      console.warn('Fullscreen/orientation lock request:', e);
    }
  }

  function init() {
    // 1. Fullscreen Button Bindings
    const lockBtn = document.getElementById('lock-landscape-btn');
    const fsBtn = document.getElementById('fs-btn');
    if (lockBtn) lockBtn.addEventListener('click', requestLandscapeFullscreen);
    if (fsBtn) fsBtn.addEventListener('click', requestLandscapeFullscreen);

    // 2. Virtual Joystick (Left Pad)
    const leftPad = document.getElementById('left-pad');
    const stickNub = document.getElementById('stick-nub');
    let padTouchId = null;

    function updateStickFromPoint(clientX, clientY) {
      const rect = leftPad.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxR = rect.width * 0.38;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist > maxR) {
        dx = (dx / dist) * maxR;
        dy = (dy / dist) * maxR;
      }
      stickNub.style.transform = `translate(${dx}px, ${dy}px)`;

      // Deadzone so slight thumb rest does not inadvertently steer
      const normX = dx / maxR;
      const normY = dy / maxR;
      input.steerX = Math.abs(normX) < 0.08 ? 0 : normX;
      input.pitchY = Math.abs(normY) < 0.08 ? 0 : normY;
    }

    function resetStick() {
      padTouchId = null;
      stickNub.style.transform = `translate(0px, 0px)`;
      input.steerX = 0;
      input.pitchY = 0;
    }

    if (leftPad) {
      leftPad.addEventListener('pointerdown', (e) => {
        padTouchId = e.pointerId;
        leftPad.setPointerCapture(e.pointerId);
        updateStickFromPoint(e.clientX, e.clientY);
      });
      leftPad.addEventListener('pointermove', (e) => {
        if (e.pointerId === padTouchId) updateStickFromPoint(e.clientX, e.clientY);
      });
      leftPad.addEventListener('pointerup', (e) => {
        if (e.pointerId === padTouchId) resetStick();
      });
      leftPad.addEventListener('pointercancel', (e) => {
        if (e.pointerId === padTouchId) resetStick();
      });
    }

    // 3. Virtual Action Buttons (Right Cluster)
    function bindActionBtn(id, keyName) {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        btn.setPointerCapture(e.pointerId);
        input[keyName] = true;
        btn.classList.add('pressed');
      });
      const release = () => {
        input[keyName] = false;
        btn.classList.remove('pressed');
      };
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
    }

    bindActionBtn('btn-boost', 'boost');
    bindActionBtn('btn-lift', 'lift');
    bindActionBtn('btn-slam', 'slam');

    // 4. Keyboard Controls
    const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyC', 'KeyQ', 'KeyE'];
    const gameKeyNames = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Up', 'Down', 'Left', 'Right'];

    window.addEventListener('keydown', (e) => {
      keys[e.code] = true;
      if (e.key) {
        keys[e.key] = true;
        keys[e.key.toLowerCase()] = true;
      }

      if (gameKeys.includes(e.code) || gameKeyNames.includes(e.key)) {
        e.preventDefault();
      }

      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift') input.boost = true;
      if (e.code === 'Space' || e.key === ' ') input.lift = true;
      if (e.code === 'KeyC' || e.key === 'c' || e.key === 'C' || e.code === 'ControlLeft' || e.key === 'Control') input.slam = true;
    });

    window.addEventListener('keyup', (e) => {
      keys[e.code] = false;
      if (e.key) {
        keys[e.key] = false;
        keys[e.key.toLowerCase()] = false;
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift') input.boost = false;
      if (e.code === 'Space' || e.key === ' ') input.lift = false;
      if (e.code === 'KeyC' || e.key === 'c' || e.key === 'C' || e.code === 'ControlLeft' || e.key === 'Control') input.slam = false;
    });

    window.addEventListener('blur', () => {
      Object.keys(keys).forEach(k => keys[k] = false);
      input.boost = false;
      input.lift = false;
      input.slam = false;
    });
  }

  function getCombinedInput() {
    let steer = input.steerX;
    let pitch = input.pitchY;

    const isLeft = !!(keys['ArrowLeft'] || keys['Left'] || keys['KeyA'] || keys['a']);
    const isRight = !!(keys['ArrowRight'] || keys['Right'] || keys['KeyD'] || keys['d']);
    const isUp = !!(keys['ArrowUp'] || keys['Up'] || keys['KeyW'] || keys['w']);
    const isDown = !!(keys['ArrowDown'] || keys['Down'] || keys['KeyS'] || keys['s']);

    if (isLeft) steer = -1;
    if (isRight) steer = 1;
    if (isUp) pitch = -1;
    if (isDown) pitch = 1;

    const isBoostKey = input.boost || !!(keys['ShiftLeft'] || keys['ShiftRight'] || keys['Shift']);
    const isLiftKey = input.lift || !!(keys['Space'] || keys[' ']);
    const isSlamKey = input.slam || !!(keys['KeyC'] || keys['c'] || keys['ControlLeft'] || keys['Control']);

    return {
      steer,
      pitch,
      isUp,
      isDown,
      isLeft,
      isRight,
      boost: isBoostKey,
      lift: isLiftKey,
      slam: isSlamKey,
      resetSlam: () => { input.slam = false; }
    };
  }

  return {
    init,
    getInput: getCombinedInput,
    getKeys: () => keys,
    requestLandscapeFullscreen
  };
})();
