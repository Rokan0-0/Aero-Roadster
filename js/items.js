/**
 * ============================================================================
 * ROAD PICKUPS & POWER-UPS SYSTEM (ROADSTER DASH INSPIRED)
 * ============================================================================
 * Spawns floating, rotating 3D power-up pickups on the highway:
 * 1. Air Canister (instant cold-gas refill)
 * 2. Starman Shield (invincibility aura)
 * 3. Rocket Fever (hypersonic speed & 2x multiplier)
 */

window.ItemSystem = (function () {
  const config = window.GameConfig.items;
  const lanePositions = window.GameConfig.road.lanePositions;
  const activeItems = [];
  let scene;

  function createAirMesh() {
    const g = new THREE.Group();
    const can = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 1.1, 12),
      new THREE.MeshStandardMaterial({
        color: 0x29b6f6,
        emissive: 0x0288d1,
        metalness: 0.8,
        roughness: 0.2
      })
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.06, 8, 16),
      new THREE.MeshBasicMaterial({ color: 0x80d8ff })
    );
    ring.rotation.x = Math.PI / 2;
    g.add(can, ring);
    return g;
  }

  function createShieldMesh() {
    const g = new THREE.Group();
    const star = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.65, 0),
      new THREE.MeshStandardMaterial({
        color: 0xffd54f,
        emissive: 0xffa000,
        metalness: 0.9,
        roughness: 0.1
      })
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.05, 8, 16),
      new THREE.MeshBasicMaterial({ color: 0xfff59d })
    );
    g.add(star, ring);
    return g;
  }

  function createRocketMesh() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 1.3, 8),
      new THREE.MeshStandardMaterial({
        color: 0xff4081,
        emissive: 0xc2185b,
        metalness: 0.7,
        roughness: 0.2
      })
    );
    body.rotation.x = -Math.PI / 2;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.06, 8, 16),
      new THREE.MeshBasicMaterial({ color: 0xff80ab })
    );
    g.add(body, ring);
    return g;
  }

  function init(targetScene) {
    scene = targetScene;
    // Pre-spawn initial items ahead
    for (let i = 0; i < 3; i++) {
      spawnItem(-120 - i * 160);
    }
  }

  function spawnItem(zPos) {
    const types = ['air', 'shield', 'rocket'];
    const type = types[Math.floor(Math.random() * types.length)];
    const lane = lanePositions[Math.floor(Math.random() * lanePositions.length)];

    let mesh;
    if (type === 'air') mesh = createAirMesh();
    else if (type === 'shield') mesh = createShieldMesh();
    else mesh = createRocketMesh();

    mesh.position.set(lane, 1.1, zPos);
    scene.add(mesh);

    activeItems.push({
      mesh,
      type,
      laneOffset: lane,
      z: zPos,
      collected: false
    });
  }

  function update(playerSpeed, dt, curvePhase, playerWorldX, playerY, onCollect) {
    for (let i = activeItems.length - 1; i >= 0; i--) {
      const item = activeItems[i];
      item.z += playerSpeed * dt;

      // Bobbing & Spinning Animation
      item.mesh.rotation.y += dt * 3.2;
      item.mesh.rotation.x += dt * 1.5;
      const bob = Math.sin(Date.now() * 0.005 + item.z * 0.1) * 0.22;
      const itemWorldX = window.GameWorld.curveX(item.z, curvePhase) + item.laneOffset;
      item.mesh.position.set(itemWorldX, 1.1 + bob, item.z);

      // Check Collection
      if (!item.collected && Math.abs(item.z) < 3.2) {
        const dx = Math.abs(playerWorldX - itemWorldX);
        if (dx < 2.0 && playerY < 2.6) {
          item.collected = true;
          scene.remove(item.mesh);
          activeItems.splice(i, 1);
          if (onCollect) onCollect(item.type);
          continue;
        }
      }

      // Despawn behind and recycle ahead
      if (item.z > 25) {
        scene.remove(item.mesh);
        activeItems.splice(i, 1);
      }
    }

    // Maintain pool of forward pickups
    if (activeItems.length < 3) {
      const furthestZ = activeItems.reduce((min, it) => Math.min(min, it.z), -100);
      spawnItem(furthestZ - 130 - Math.random() * 80);
    }
  }

  function reset() {
    activeItems.forEach((it) => {
      if (it.mesh && scene) scene.remove(it.mesh);
    });
    activeItems.length = 0;
    for (let i = 0; i < 3; i++) {
      spawnItem(-120 - i * 160);
    }
  }

  return {
    init,
    update,
    reset,
    getItems: () => activeItems
  };
})();
