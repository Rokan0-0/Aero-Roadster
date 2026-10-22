/**
 * ============================================================================
 * COLD-GAS CONDENSATION PARTICLE SYSTEM
 * ============================================================================
 * High-performance object-pooled particle system emitting expanding white
 * cryo-condensation vapor plumes from the rear thruster nozzles.
 */

window.ParticleSystem = (function () {
  const cryoParticles = [];
  let cryoPoolGroup;
  let cryoIdx = 0;
  const POOL_SIZE = 120;

  function init(scene) {
    const cryoTex = window.TextureGenerator.createCryoSpriteTexture();
    cryoPoolGroup = new THREE.Group();
    scene.add(cryoPoolGroup);

    for (let i = 0; i < POOL_SIZE; i++) {
      const mat = new THREE.SpriteMaterial({
        map: cryoTex,
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      cryoPoolGroup.add(sprite);

      cryoParticles.push({
        sprite,
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        scale: 1
      });
    }
  }

  function spawnCondensation(worldPos, vx, vy, vz, baseScale, maxLife) {
    const p = cryoParticles[cryoIdx];
    cryoIdx = (cryoIdx + 1) % cryoParticles.length;

    p.sprite.position.copy(worldPos);
    p.vel.set(vx, vy, vz);
    p.life = maxLife;
    p.maxLife = maxLife;
    p.scale = baseScale;
    p.sprite.scale.set(baseScale, baseScale, 1);
    p.sprite.material.opacity = 0.45;
    p.sprite.visible = true;
  }

  function update(dt) {
    for (let i = 0; i < cryoParticles.length; i++) {
      const p = cryoParticles[i];
      if (!p.sprite.visible) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.sprite.visible = false;
        continue;
      }

      p.sprite.position.addScaledVector(p.vel, dt);
      const ratio = 1 - p.life / p.maxLife;
      const s = p.scale * (1 + ratio * 1.5);
      p.sprite.scale.set(s, s, 1);
      p.sprite.material.opacity = (1 - ratio) * 0.45;
    }
  }

  return {
    init,
    spawnCondensation,
    update
  };
})();
