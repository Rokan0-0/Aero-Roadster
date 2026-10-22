/**
 * ============================================================================
 * PRECISION THRUSTER PARKING ENGINE
 * ============================================================================
 * Precision low-speed cold-gas thruster physics:
 * - Translation: WASD / Joystick
 * - Yaw: Q / E (keyboard) or stick steering
 * - Vertical: Space (Lift), C (Drop / Slam)
 * - Fuel drain, obstacle collisions, 1-second park check, 3-star rating.
 */

window.ParkingEngine = (function () {
  let activeLevel = null;
  let parkTimer = 0;
  let isParked = false;
  let elapsedTime = 0;
  let autoStabilize = false;

  // Parking Vehicle State
  const pState = {
    x: 0,
    y: 1.5,
    z: 20,
    vx: 0,
    vy: 0,
    vz: 0,
    yaw: 0,
    vYaw: 0,
    roll: 0,
    pitch: 0,
    gas: 100,
    health: 100
  };

  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.key) {
      keys[e.key] = true;
      keys[e.key.toLowerCase()] = true;
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.key) {
      keys[e.key] = false;
      keys[e.key.toLowerCase()] = false;
    }
  });
  window.addEventListener('blur', () => {
    Object.keys(keys).forEach(k => keys[k] = false);
  });

  function startLevel(scene, levelIndex = 0) {
    activeLevel = window.LevelManager.loadLevel(scene, levelIndex);
    const start = activeLevel.startPosition;
    const currentCar = window.CarsManager ? window.CarsManager.getCurrentCar() : null;
    const maxGas = currentCar ? currentCar.gasCapacity : 100;
    const maxHp = currentCar ? currentCar.durability : 100;

    pState.x = start.x;
    pState.y = start.y;
    pState.z = start.z;
    pState.yaw = start.rotationY || 0;
    pState.vx = 0;
    pState.vy = 0;
    pState.vz = 0;
    pState.vYaw = 0;
    pState.roll = 0;
    pState.pitch = 0;
    pState.gas = maxGas;
    pState.maxGas = maxGas;
    pState.health = maxHp;
    pState.maxHealth = maxHp;

    parkTimer = 0;
    isParked = false;
    elapsedTime = 0;

    window.LevelManager.setVisible(true);
  }

  function update(dt, input, onParkSuccess, onDamage) {
    if (isParked) return;

    elapsedTime += dt;

    // 1. Read Inputs
    let thrustFwd = input ? input.pitch : 0;
    let thrustLat = input ? input.steer : 0;
    let thrustUp = 0;
    let yawInput = 0;

    // Keyboard explicit overrides (WASD / Arrows)
    if (keys['KeyW'] || keys['ArrowUp'] || keys['w'] || keys['Up']) thrustFwd = -1;
    if (keys['KeyS'] || keys['ArrowDown'] || keys['s'] || keys['Down']) thrustFwd = 1;
    if (keys['KeyA'] || keys['ArrowLeft'] || keys['a'] || keys['Left']) thrustLat = -1;
    if (keys['KeyD'] || keys['ArrowRight'] || keys['d'] || keys['Right']) thrustLat = 1;

    // Yaw: Q & E keys or horizontal stick twist
    if (keys['KeyQ'] || keys['q'] || keys['Q']) yawInput += 1;
    if (keys['KeyE'] || keys['e'] || keys['E']) yawInput -= 1;

    // Vertical Cold-Gas Lift & Drop
    if ((input && input.lift) || keys['Space'] || keys[' ']) thrustUp += 1;
    if ((input && input.slam) || keys['KeyC'] || keys['c'] || keys['ControlLeft']) thrustUp -= 1;

    const hasGas = pState.gas > 0;
    const isThrusting = (thrustFwd !== 0 || thrustLat !== 0 || thrustUp !== 0 || yawInput !== 0) && hasGas;

    // Fuel Drain
    if (isThrusting) {
      pState.gas = Math.max(0, pState.gas - dt * 9.5);
    }

    // 2. Flight Acceleration & Damping
    const currentCar = window.CarsManager ? window.CarsManager.getCurrentCar() : null;
    const basePower = currentCar ? currentCar.thrusterPower : 9.5;
    const carMass = currentCar ? currentCar.mass : 1.0;
    const thrustPower = hasGas ? (basePower / carMass) : 0;
    const cosY = Math.cos(pState.yaw);
    const sinY = Math.sin(pState.yaw);

    // World relative thrust
    const fx = (thrustLat * cosY + thrustFwd * sinY) * thrustPower;
    const fz = (-thrustLat * sinY + thrustFwd * cosY) * thrustPower;

    // Apply wind if defined in level
    const wind = activeLevel ? activeLevel.wind : { x: 0, z: 0 };
    pState.vx += (fx + wind.x) * dt;
    pState.vz += (fz + wind.z) * dt;

    // Vertical forces (Lift vs Gravity)
    const liftForce = hasGas && thrustUp > 0 ? (16.0 * (basePower / 9.5) / carMass) : (hasGas && thrustUp < 0 ? -18.0 : 0);
    pState.vy += (liftForce - 9.8) * dt;

    // Aerodynamic flight air-resistance damping
    const drag = 0.94;
    pState.vx *= drag;
    pState.vz *= drag;
    pState.vy *= 0.95;

    // Yaw angular velocity
    pState.vYaw += (yawInput * 3.5) * dt;
    pState.vYaw *= 0.86;
    pState.yaw += pState.vYaw * dt;

    // Dynamic tilt roll & pitch response to lateral acceleration
    const targetRoll = -thrustLat * 0.18;
    const targetPitch = thrustFwd * 0.18;
    pState.roll = THREE.MathUtils.lerp(pState.roll, targetRoll, dt * 6.0);
    pState.pitch = THREE.MathUtils.lerp(pState.pitch, targetPitch, dt * 6.0);

    // Apply movement
    pState.x += pState.vx * dt;
    pState.y += pState.vy * dt;
    pState.z += pState.vz * dt;

    // Ground floor collision
    if (pState.y <= 0.05) {
      pState.y = 0.05;
      pState.vy = Math.max(0, pState.vy * -0.2);
      pState.roll *= 0.8;
      pState.pitch *= 0.8;
    }

    // Obstacle Box Collision
    checkObstacleCollisions(onDamage);

    // 3. Park Validation Logic
    validateParking(dt, onParkSuccess);

    // 4. Update Sound
    window.SoundFX.update(Math.hypot(pState.vx, pState.vz) * 35, thrustUp > 0, false, dt);
  }

  function checkObstacleCollisions(onDamage) {
    const obstacles = window.LevelManager.getObstacles();
    const carRadius = 1.35;

    obstacles.forEach((obs) => {
      if (
        pState.x + carRadius > obs.minX &&
        pState.x - carRadius < obs.maxX &&
        pState.z + carRadius > obs.minZ &&
        pState.z - carRadius < obs.maxZ &&
        pState.y < obs.maxY &&
        pState.y + 1.2 > obs.minY
      ) {
        // Bounce back
        pState.vx *= -0.6;
        pState.vz *= -0.6;
        pState.vy = 2.5;
        pState.health = Math.max(0, pState.health - 25);
        window.SoundFX.playCrash();
        if (onDamage) onDamage(pState.health);
      }
    });
  }

  function validateParking(dt, onParkSuccess) {
    const bays = window.LevelManager.getBays();
    if (!bays || bays.length === 0) return;

    const bay = bays[0].data;
    const distToBay = Math.hypot(pState.x - bay.x, pState.z - bay.z);
    const speed = Math.hypot(pState.vx, pState.vz, pState.vy);
    const yawDiff = Math.abs(((pState.yaw - (bay.rotationY || 0)) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
    const tilt = Math.hypot(pState.roll, pState.pitch);

    // Check strict tolerance criteria:
    // Inside bay (< 0.85m), Low Speed (< 0.35m/s), Low Altitude (< 0.25m), Low Tilt (< 0.16rad), Heading Aligned (< 0.26rad ~ 15deg)
    const isInside = distToBay < 0.85;
    const isSlow = speed < 0.35;
    const isGrounded = pState.y < 0.25;
    const isLevel = tilt < 0.16;
    const isAligned = yawDiff < 0.26;

    const isValid = isInside && isSlow && isGrounded && isLevel && isAligned;

    if (isValid) {
      parkTimer += dt;
      window.LevelManager.setBayGlowColor(true, parkTimer);

      if (parkTimer >= 1.0 && !isParked) {
        isParked = true;
        window.LevelManager.setBayGlowColor(true, 1.0);
        calculateAndFinish(onParkSuccess);
      }
    } else {
      parkTimer = Math.max(0, parkTimer - dt * 2.0);
      window.LevelManager.setBayGlowColor(false, parkTimer);
    }
  }

  function calculateAndFinish(onParkSuccess) {
    const parTime = activeLevel.parTime;
    const gasPct = (pState.gas / (pState.maxGas || 100)) * 100;
    const healthPct = (pState.health / (pState.maxHealth || 100)) * 100;

    // Calculate 1 to 3 Stars
    let stars = 1; // Completed the park
    if (elapsedTime <= parTime && gasPct >= 20) {
      stars = 2;
    }
    if (elapsedTime <= parTime && gasPct >= 40 && healthPct >= 99) {
      stars = 3; // "PERFECT PARK"
    }

    window.SoundFX.playStuntChime();

    if (onParkSuccess) {
      onParkSuccess({
        stars,
        time: elapsedTime,
        parTime,
        gas: gasPct,
        health: healthPct,
        levelName: activeLevel.name,
        levelId: activeLevel.id
      });
    }
  }

  return {
    startLevel,
    update,
    getState: () => pState,
    getParkTimer: () => parkTimer,
    isParked: () => isParked,
    toggleAutoStabilize: () => { autoStabilize = !autoStabilize; return autoStabilize; }
  };
})();
