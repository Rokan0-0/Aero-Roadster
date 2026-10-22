/**
 * ============================================================================
 * MAIN GAME ENGINE & LOOP (LOBBY, DASH & PARKING MODES)
 * ============================================================================
 * Coordinates Scene, Orbiting Lobby Showcase, Dash Endless Highway,
 * Precision Thruster Parking Mode (Levels 1-6), and Pause State.
 */

window.GameEngine = (function () {
  const config = window.GameConfig;
  const pConf = config.player;
  const phys = config.physics;
  const fConf = config.fuel;
  const camConf = config.camera;

  let canvas, renderer, scene, camera, clock;
  let speedLinesEl;
  const tmpVec = new THREE.Vector3();

  // Active Vehicle & Dash Gameplay State
  const state = {
    lateralX: 0,       // Distance from road centerline (-8.9 to +8.9 on ground)
    vx: 0,             // Lateral velocity
    y: 0,              // Altitude above road surface
    vy: 0,             // Vertical climb / fall velocity
    speed: pConf.baseSpeed,
    fuel: fConf.initial,
    health: config.health.maxHealth,
    airborne: false,
    rollAngle: 0,
    pitchAngle: 0,
    accumRoll: 0,
    accumPitch: 0,
    wingDeploy: 0,
    distanceZ: 0,
    isGameOver: false,

    // Power-Up & Damage Timers
    shieldTimer: 0,
    feverTimer: 0,
    invulnTimer: 0,
    cameraShake: 0
  };

  let currentParkingLevel = 0;

  function triggerShake(intensity) {
    state.cameraShake = Math.max(state.cameraShake, intensity);
  }

  function recenterPlayer() {
    state.lateralX = 0;
    state.vx = 0;
    state.y = 0;
    state.vy = 0;
    state.rollAngle = 0;
    state.pitchAngle = 0;
    state.airborne = false;
  }

  function handleStunt(stuntKey, customPts, customFuel) {
    const isFever = state.feverTimer > 0;
    const bonus = window.UIController.addStunt(stuntKey, customPts, customFuel, isFever);
    state.fuel = Math.min(fConf.max, state.fuel + bonus);
  }

  function handleItemCollect(type) {
    window.SoundFX.playItemPickup();
    const itemData = config.items.types[type];

    if (type === 'air') {
      state.fuel = fConf.max;
      window.UIController.addStunt('⚡ AIR REFILL', 100, 50);
    } else if (type === 'shield') {
      state.shieldTimer = itemData.duration;
      window.UIController.addStunt('⭐ STARMAN SHIELD', 200, 20);
    } else if (type === 'rocket') {
      state.feverTimer = itemData.duration;
      state.speed = pConf.feverSpeed;
      triggerShake(0.35);
      window.UIController.addStunt('🚀 ROCKET FEVER', 300, 30);
    }
  }

  function handleTrafficDamage() {
    if (state.shieldTimer > 0 || state.invulnTimer > 0 || state.isGameOver) return;

    state.health = Math.max(0, state.health - config.health.hitDamage);
    state.invulnTimer = config.health.invulnerabilityAfterHit;
    triggerShake(0.65);
    window.SoundFX.playCrash();

    if (state.health <= 0) {
      triggerGameOver();
    }
  }

  function triggerGameOver() {
    state.isGameOver = true;
    state.vy = 10.0;
    state.vx = (Math.random() - 0.5) * 14;
    state.airborne = true;
    triggerShake(1.0);
    window.SoundFX.playCrash();
    window.UIController.showGameOver();
  }

  function restartDash() {
    state.isGameOver = false;
    const currentCar = window.CarsManager ? window.CarsManager.getCurrentCar() : null;
    state.health = currentCar ? currentCar.durability : config.health.maxHealth;
    state.fuel = currentCar ? currentCar.gasCapacity : fConf.initial;
    state.speed = pConf.baseSpeed;
    state.distanceZ = 0;
    state.lateralX = 0;
    state.vx = 0;
    state.y = 0;
    state.vy = 0;
    state.airborne = false;
    state.rollAngle = 0;
    state.pitchAngle = 0;
    state.shieldTimer = 0;
    state.feverTimer = 0;
    state.invulnTimer = 0;
    state.cameraShake = 0;

    window.TrafficSystem.reset();
    window.ItemSystem.reset();
    window.LevelManager.setVisible(false);
    window.UIController.hideGameOver();
    window.GameState.set(window.GameState.STATES.PLAYING_DASH);
  }

  function startParking(levelIdx = 0) {
    currentParkingLevel = levelIdx;
    window.ParkingEngine.startLevel(scene, currentParkingLevel);
    window.GameState.set(window.GameState.STATES.PLAYING_PARKING);
  }

  function onParkingSuccess(resultData) {
    window.UIController.showResult(resultData);
    window.GameState.set(window.GameState.STATES.RESULT);
  }

  function nextParkingLevel() {
    const nextIdx = (currentParkingLevel + 1) % window.LevelManager.LEVELS.length;
    startParking(nextIdx);
  }

  function init() {
    canvas = document.getElementById('game-canvas');
    speedLinesEl = document.getElementById('speed-lines');

    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      camConf.defaultFov,
      window.innerWidth / window.innerHeight,
      0.5,
      900
    );

    clock = new THREE.Clock();

    // Initialize all modular subsystems
    window.GameWorld.init(scene, renderer);
    window.PlayerCar.init(scene);
    if (window.CarsManager) window.CarsManager.init();
    window.ParticleSystem.init(scene);
    window.ItemSystem.init(scene);
    window.TrafficSystem.init(scene);
    window.InputController.init();
    window.SoundFX.init();
    window.UIController.init(
      recenterPlayer,
      (tier) => { window.GameWorld.applyQuality(tier); },
      restartDash,
      () => { startParking(currentParkingLevel); },
      nextParkingLevel,
      (levelIdx) => { startParking(levelIdx); }
    );

    window.addEventListener('resize', onWindowResize);

    // React to State changes
    window.GameState.onChange((toState) => {
      if (toState === window.GameState.STATES.LOBBY) {
        window.LevelManager.setVisible(false);
        state.speed = 0;
      } else if (toState === window.GameState.STATES.PLAYING_DASH) {
        window.LevelManager.setVisible(false);
      } else if (toState === window.GameState.STATES.PLAYING_PARKING) {
        window.LevelManager.setVisible(true);
      }
    });

    // Boot straight into LOBBY
    window.GameState.set(window.GameState.STATES.LOBBY);

    animate();
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    requestAnimationFrame(animate);

    const currentState = window.GameState.get();
    const dt = Math.min(clock.getDelta(), 0.033);

    const playerCar = window.PlayerCar.getCar();
    const carVisual = window.PlayerCar.getVisual();
    const activeWing = window.PlayerCar.getActiveWing();

    // =========================================================================
    // 1. LOBBY ORBITING CAMERA SHOWCASE
    // =========================================================================
    if (currentState === window.GameState.STATES.LOBBY) {
      playerCar.position.set(0, 0, 0);
      carVisual.rotation.set(0, 0, 0);
      window.PlayerCar.updateWing(0);
      window.PlayerCar.setThrusterIntensity(0);
      window.SoundFX.update(0, false, false, dt);

      const orbitAngle = clock.elapsedTime * 0.22;
      const orbitRadius = 8.8;
      camera.fov = camConf.defaultFov;
      camera.updateProjectionMatrix();
      camera.position.set(Math.sin(orbitAngle) * orbitRadius, 2.6, Math.cos(orbitAngle) * orbitRadius);
      camera.lookAt(0, 0.85, 0);

      renderer.render(scene, camera);
      return;
    }

    // =========================================================================
    // 2. PAUSE OR RESULT FROZEN STATE
    // =========================================================================
    if (currentState === window.GameState.STATES.PAUSED || currentState === window.GameState.STATES.RESULT) {
      window.SoundFX.update(0, false, false, dt);
      renderer.render(scene, camera);
      return;
    }

    // =========================================================================
    // 3. PLAYING PARKING MODE (LEVELS 1–6)
    // =========================================================================
    if (currentState === window.GameState.STATES.PLAYING_PARKING) {
      const input = window.InputController.getInput();
      window.ParkingEngine.update(dt, input, onParkingSuccess, (health) => {
        triggerShake(0.6);
      });

      const pState = window.ParkingEngine.getState();
      playerCar.position.set(pState.x, pState.y, pState.z);
      carVisual.rotation.set(pState.pitch, pState.yaw, pState.roll);

      // Deploy active wing slightly while airborne
      window.PlayerCar.updateWing(pState.y > 0.4 ? 0.75 : 0);

      // Thruster lighting & condensation plumes
      const isThrusting = (input.lift || input.slam || Math.abs(input.pitch) > 0.1 || Math.abs(input.steer) > 0.1) && pState.gas > 0;
      window.PlayerCar.setThrusterIntensity(isThrusting ? 2.0 : 0);

      if (isThrusting && Math.random() < 0.4) {
        tmpVec.set((Math.random() - 0.5) * 1.0, 0.65, 2.3).applyMatrix4(carVisual.matrixWorld);
        window.ParticleSystem.spawnCondensation(
          tmpVec,
          (Math.random() - 0.5) * 2,
          -4 - Math.random() * 4,
          (Math.random() - 0.5) * 2,
          0.85,
          0.35
        );
      }

      // Smooth chase camera following vehicle in 3D parking lot from BEHIND
      const camDist = 8.5;
      const camHeight = 3.6;
      const targetCamX = pState.x + Math.sin(pState.yaw) * camDist;
      const targetCamZ = pState.z + Math.cos(pState.yaw) * camDist;
      const targetCamY = Math.max(2.5, pState.y + camHeight);

      camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), dt * 6.5);
      camera.lookAt(
        pState.x - Math.sin(pState.yaw) * 4.0,
        pState.y + 0.75,
        pState.z - Math.cos(pState.yaw) * 4.0
      );

      // Update HUD
      const speedKmh = Math.hypot(pState.vx, pState.vz) * 35;
      window.UIController.updateHUD(
        speedKmh,
        pState.gas,
        pState.health,
        0,
        pState.y > 0.2,
        false,
        null,
        0,
        dt
      );

      const bays = window.LevelManager.getBays();
      const isInside = bays.length > 0 && Math.hypot(pState.x - bays[0].data.x, pState.z - bays[0].data.z) < 1.2;
      window.UIController.updateParkingHUD(window.ParkingEngine.getParkTimer(), isInside);

      window.ParticleSystem.update(dt);
      renderer.render(scene, camera);
      return;
    }

    // =========================================================================
    // 4. PLAYING DASH MODE (HIGH-SPEED ENDLESS HIGHWAY)
    // =========================================================================
    const input = window.InputController.getInput();
    const conceptMode = window.UIController.getConceptMode();
    const qualityTier = window.UIController.getQualityTier();
    const curvePhase = state.distanceZ * 0.008;

    // Decay Timers
    if (state.shieldTimer > 0) state.shieldTimer = Math.max(0, state.shieldTimer - dt);
    if (state.feverTimer > 0) state.feverTimer = Math.max(0, state.feverTimer - dt);
    if (state.invulnTimer > 0) state.invulnTimer = Math.max(0, state.invulnTimer - dt);
    if (state.cameraShake > 0) state.cameraShake = Math.max(0, state.cameraShake - dt * 4.0);

    let activeItem = null;
    let itemTimer = 0;
    if (state.feverTimer > 0) {
      activeItem = config.items.types.rocket;
      itemTimer = state.feverTimer;
    } else if (state.shieldTimer > 0) {
      activeItem = config.items.types.shield;
      itemTimer = state.shieldTimer;
    }

    window.PlayerCar.setShieldAura(state.shieldTimer > 0);

    if (state.invulnTimer > 0) {
      carVisual.visible = (Math.floor(Date.now() / 90) % 2 === 0);
    } else {
      carVisual.visible = true;
    }

    if (conceptMode > 0) {
      state.distanceZ += 95 * dt;
      window.GameWorld.updateScenery(state.distanceZ, 95, dt, curvePhase);

      playerCar.position.x = 0;
      if (activeWing) activeWing.position.y = 1.18;

      if (conceptMode === 1) {
        playerCar.position.y = 4.2 + Math.sin(clock.elapsedTime * 2.5) * 0.35;
        carVisual.rotation.set(0.14, 0, clock.elapsedTime * 3.2);
        camera.position.set(0.5, 3.6, 10.5);
        camera.lookAt(0, 2.8, -25);
      } else if (conceptMode === 2) {
        playerCar.position.y = 0;
        carVisual.rotation.set(0, -0.08, 0.06);
        camera.position.set(-14, 11.5, 18);
        camera.lookAt(8, 2.5, -45);
      } else if (conceptMode === 3) {
        playerCar.position.y = 0.25;
        carVisual.rotation.set(-0.06, 0.22, 0);
        camera.position.set(3.4, 1.55, 4.9);
        camera.lookAt(-0.3, 0.95, 0.5);
      }

      for (let n = 0; n < 3; n++) {
        tmpVec.set((Math.random() - 0.5) * 1.1, 0.72, 2.65).applyMatrix4(carVisual.matrixWorld);
        window.ParticleSystem.spawnCondensation(
          tmpVec,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.3) * 2,
          26 + Math.random() * 10,
          1.35,
          0.45
        );
      }
    } else if (state.isGameOver) {
      state.y += state.vy * dt;
      state.vy -= phys.gravity * dt;
      state.lateralX += state.vx * dt;
      state.rollAngle += 7.0 * dt;
      state.pitchAngle += 4.5 * dt;

      if (state.y <= 0) {
        state.y = 0;
        state.vy = 0;
        state.vx *= 0.88;
      }

      playerCar.position.set(state.lateralX, state.y, 0);
      carVisual.rotation.set(state.pitchAngle, 0, state.rollAngle);
      window.SoundFX.update(0, false, false, dt);

    } else {
      // LIVE ARCADE DASH
      const isFever = state.feverTimer > 0;
      const usingBoost = (input.boost && state.fuel > 1) || (input.isUp && state.fuel > 1) || isFever;
      const usingLift = input.lift && state.fuel > 1;
      const usingSlam = (input.slam || input.isDown) && state.airborne;

      let targetSpeed = pConf.baseSpeed;
      if (isFever) targetSpeed = pConf.feverSpeed;
      else if (usingBoost) targetSpeed = pConf.boostSpeed;

      state.speed = THREE.MathUtils.lerp(state.speed, targetSpeed, dt * 3.8);

      window.SoundFX.update(state.speed, usingLift, usingBoost, dt);

      if (!isFever) {
        if (usingBoost || usingLift) {
          const drain = (usingBoost && usingLift) ? fConf.comboDrainRate : fConf.boostDrainRate;
          state.fuel = Math.max(0, state.fuel - drain * dt);
        } else {
          state.fuel = Math.min(fConf.max, state.fuel + fConf.rechargeRate * dt);
        }
      }

      const steerSpeed = state.airborne ? pConf.steerSpeedAir : pConf.steerSpeedGround;
      state.vx = THREE.MathUtils.lerp(state.vx, input.steer * steerSpeed, dt * 9.0);
      state.lateralX += state.vx * dt;

      if (!state.airborne && Math.abs(input.steer) < 0.05) {
        state.vx *= 0.88;
      }

      const limit = config.road.safeHalfWidth;
      if (state.lateralX < -limit) {
        state.lateralX = -limit;
        state.vx = Math.max(0, state.vx * pConf.guardrailBounce);
        triggerShake(0.15);
      } else if (state.lateralX > limit) {
        state.lateralX = limit;
        state.vx = Math.min(0, state.vx * pConf.guardrailBounce);
        triggerShake(0.15);
      }

      if (usingLift) {
        if (!state.airborne) {
          state.vy = phys.jumpImpulse;
          state.airborne = true;
          triggerShake(0.15);
        } else {
          state.vy += phys.airContinuousThrust * dt;
          state.vy = Math.min(state.vy, phys.maxAirVelocityY);
        }
      }

      if (usingSlam) {
        state.vy = phys.slamVelocity;
        handleStunt('slam');
        triggerShake(0.45);
        input.resetSlam();
      }

      state.y += state.vy * dt;
      if (state.airborne) {
        state.vy -= phys.gravity * dt;
      }

      if (state.y <= 0) {
        if (state.airborne) {
          const normRoll = Math.abs(((state.rollAngle % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
          const normPitch = Math.abs(((state.pitchAngle % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
          if (normRoll < phys.landingTolerance && normPitch < phys.landingTolerance) {
            handleStunt('perfectLanding');
            triggerShake(0.25);
          } else {
            triggerShake(0.3);
          }
          window.UIController.bankPendingScore();
        }
        state.y = 0;
        state.vy = 0;
        state.airborne = false;
        state.accumRoll = 0;
        state.accumPitch = 0;
        state.rollAngle = THREE.MathUtils.lerp(state.rollAngle, -input.steer * 0.08, dt * 10);
        state.pitchAngle = THREE.MathUtils.lerp(state.pitchAngle, usingBoost ? -0.04 : 0, dt * 10);
      }

      if (state.airborne) {
        const rollRate = -input.steer * phys.rollRate;
        const pitchRate = input.pitch * phys.pitchRate;
        state.rollAngle += rollRate * dt;
        state.pitchAngle += pitchRate * dt;
        state.accumRoll += Math.abs(rollRate * dt);
        state.accumPitch += Math.abs(pitchRate * dt);

        if (Math.abs(input.steer) < 0.05) {
          state.rollAngle = THREE.MathUtils.lerp(
            state.rollAngle,
            Math.round(state.rollAngle / (Math.PI * 2)) * (Math.PI * 2),
            dt * 5.0
          );
        }
        if (Math.abs(input.pitch) < 0.05) {
          state.pitchAngle = THREE.MathUtils.lerp(state.pitchAngle, 0, dt * 5.0);
        }

        if (state.accumRoll >= Math.PI * 1.82) {
          state.accumRoll -= Math.PI * 1.82;
          handleStunt('barrelRoll');
          triggerShake(0.25);
        }
        if (state.accumPitch >= Math.PI * 1.82) {
          state.accumPitch -= Math.PI * 1.82;
          handleStunt('zeroGFlip');
          triggerShake(0.3);
        }
      }

      playerCar.position.set(state.lateralX, state.y, 0);
      carVisual.rotation.set(state.pitchAngle, -input.steer * 0.12, state.rollAngle);

      const targetWing = (usingBoost || usingLift || state.airborne) ? 1.0 : 0.0;
      state.wingDeploy = THREE.MathUtils.lerp(state.wingDeploy, targetWing, dt * 8);
      window.PlayerCar.updateWing(state.wingDeploy);

      window.PlayerCar.updateWheels(state.speed, dt);

      const thrusterOn = usingBoost || usingLift;
      window.PlayerCar.setThrusterIntensity(thrusterOn ? 2.4 : 0.0);

      const pCount = qualityTier === 'MOBILE' ? 2 : 4;
      if (usingBoost) {
        for (let i = 0; i < pCount; i++) {
          tmpVec.set((Math.random() - 0.5) * 1.2, 0.72, 2.55).applyMatrix4(carVisual.matrixWorld);
          window.ParticleSystem.spawnCondensation(
            tmpVec,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.3) * 2.5,
            32 + Math.random() * 14,
            1.1 + Math.random() * 0.7,
            0.42
          );
        }
      }
      if (usingLift) {
        for (let i = 0; i < pCount; i++) {
          tmpVec.set((Math.random() - 0.5) * 1.6, 0.2, (Math.random() - 0.5) * 2.6).applyMatrix4(carVisual.matrixWorld);
          window.ParticleSystem.spawnCondensation(
            tmpVec,
            (Math.random() - 0.5) * 6,
            -18 - Math.random() * 8,
            12 + Math.random() * 8,
            1.35 + Math.random() * 0.6,
            0.48
          );
        }
      }

      state.distanceZ += state.speed * dt;
      window.GameWorld.updateScenery(state.distanceZ, state.speed, dt, curvePhase);

      window.UIController.updateHUD(
        state.speed,
        state.fuel,
        state.health,
        state.distanceZ,
        state.airborne,
        usingBoost,
        activeItem,
        itemTimer,
        dt
      );

      if (speedLinesEl) {
        speedLinesEl.style.opacity = isFever ? '0.85' : (usingBoost ? '0.6' : '0');
      }

      let targetFov = camConf.defaultFov;
      if (isFever) targetFov = camConf.feverFov;
      else if (usingBoost) targetFov = camConf.boostFov;

      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dt * camConf.fovLerp);
      camera.updateProjectionMatrix();

      const shakeX = Math.sin(Date.now() * 0.035) * state.cameraShake * 0.35;
      const shakeY = Math.cos(Date.now() * 0.028) * state.cameraShake * 0.35;

      const camTargetX = THREE.MathUtils.lerp(camera.position.x, state.lateralX * 0.78, dt * 7.5) + shakeX;
      const camTargetY = THREE.MathUtils.lerp(camera.position.y, camConf.baseHeight + state.y * 0.55, dt * 7.5) + shakeY;
      camera.position.set(camTargetX, camTargetY, camConf.followDistanceZ);
      camera.lookAt(state.lateralX * 0.6, 1.3 + state.y * 0.35, -28);
    }

    // Traffic Simulation & Proximity Detection
    window.TrafficSystem.update(
      state.speed,
      dt,
      curvePhase,
      playerCar.position.x,
      state.y,
      conceptMode,
      state,
      handleStunt,
      handleTrafficDamage
    );

    // Floating Collectible Items System
    window.ItemSystem.update(
      state.speed,
      dt,
      curvePhase,
      playerCar.position.x,
      state.y,
      handleItemCollect
    );

    window.ParticleSystem.update(dt);

    renderer.render(scene, camera);
  }

  return {
    init,
    getState: () => state,
    restartDash,
    startParking
  };
})();

// Start game once DOM content is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.GameEngine.init();
});
