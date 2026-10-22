/**
 * ============================================================================
 * AI TRAFFIC SYSTEM
 * ============================================================================
 * Manages highway obstacle traffic vehicles, respawning ahead in lanes,
 * and handles near-miss, jump-over, shield-smash, and crash damage collisions.
 */

window.TrafficSystem = (function () {
  const config = window.GameConfig.traffic;
  const trafficCars = [];
  let scene;

  function init(targetScene) {
    scene = targetScene;
    const canopyGlassMat = new THREE.MeshStandardMaterial({
      color: 0x11131c,
      metalness: 0.92,
      roughness: 0.06
    });

    for (let i = 0; i < config.count; i++) {
      const tGroup = new THREE.Group();
      const tBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.75, 4.3),
        new THREE.MeshStandardMaterial({
          color: config.colors[i % config.colors.length],
          roughness: 0.3,
          metalness: 0.5
        })
      );
      tBody.position.y = 0.6;

      const tCabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.55, 2.2), canopyGlassMat);
      tCabin.position.set(0, 1.15, -0.1);

      const tTail = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 0.12, 0.1),
        new THREE.MeshBasicMaterial({ color: 0xff3b30 })
      );
      tTail.position.set(0, 0.72, 2.16);

      tGroup.add(tBody, tCabin, tTail);
      scene.add(tGroup);

      trafficCars.push({
        mesh: tGroup,
        laneOffset: (i % 3 - 1) * 5.8,
        z: -65 - i * 68,
        speed: config.baseSpeed + (i % 3) * config.speedVariation,
        cleared: false,
        flyingAway: false,
        vy: 0,
        spinY: 0
      });
    }
  }

  function update(playerSpeed, dt, curvePhase, playerWorldX, playerY, conceptMode, state, onStunt, onDamage) {
    trafficCars.forEach((tc) => {
      // If car was smashed by Starman Shield, animate it tumbling away into the sky!
      if (tc.flyingAway) {
        tc.mesh.position.y += tc.vy * dt;
        tc.mesh.rotation.y += tc.spinY * dt;
        tc.mesh.rotation.z += tc.spinY * 0.7 * dt;
        tc.vy -= 30 * dt;
        tc.z -= 15 * dt;
        if (tc.mesh.position.y < -10 || tc.z < -450) {
          tc.flyingAway = false;
          tc.mesh.position.y = 0;
          tc.mesh.rotation.set(0, 0, 0);
          tc.z = config.spawnDistanceZ - Math.random() * config.spawnJitterZ;
          tc.laneOffset = (Math.floor(Math.random() * 3) - 1) * 5.8;
          tc.cleared = false;
        }
        return;
      }

      tc.z += (playerSpeed - tc.speed) * dt;

      // Respawn ahead when passed behind
      if (tc.z > config.despawnDistanceZ) {
        tc.z = config.spawnDistanceZ - Math.random() * config.spawnJitterZ;
        tc.laneOffset = (Math.floor(Math.random() * 3) - 1) * 5.8;
        tc.cleared = false;
      }

      const tWorldX = window.GameWorld.curveX(tc.z, curvePhase) + tc.laneOffset;
      tc.mesh.position.set(tWorldX, 0, tc.z);

      // Proximity & interaction check
      if (Math.abs(tc.z) < 3.6 && !tc.cleared) {
        const dx = Math.abs(playerWorldX - tWorldX);

        if (state.shieldTimer > 0 && dx < 2.2) {
          // STARMAN SHIELD SMASH! Fling traffic into the stratosphere
          tc.cleared = true;
          tc.flyingAway = true;
          tc.vy = 28 + Math.random() * 12;
          tc.spinY = 12 + Math.random() * 8;
          if (onStunt) onStunt('trafficSmash');
        } else if (dx < 2.2 && playerY > 1.35) {
          // Leap directly over traffic
          tc.cleared = true;
          if (onStunt) onStunt('airClear');
        } else if (dx < 1.85 && playerY <= 1.35 && conceptMode === 0) {
          // Ground collision: take hull damage or launch!
          tc.cleared = true;
          state.speed *= 0.72;
          state.vy = 6.0;
          state.airborne = true;
          if (onDamage) onDamage();
          if (onStunt) onStunt('trafficLaunch');
        } else if (dx >= 1.85 && dx < 3.6) {
          // High speed slalom near miss
          tc.cleared = true;
          if (onStunt) onStunt('nearMiss');
        }
      }
    });
  }

  function reset() {
    trafficCars.forEach((tc, i) => {
      tc.z = -65 - i * 68;
      tc.laneOffset = (i % 3 - 1) * 5.8;
      tc.cleared = false;
      tc.flyingAway = false;
      tc.mesh.position.set(tc.laneOffset, 0, tc.z);
      tc.mesh.rotation.set(0, 0, 0);
    });
  }

  return {
    init,
    update,
    reset,
    getVehicles: () => trafficCars
  };
})();
