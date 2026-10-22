/**
 * ============================================================================
 * PROCEDURAL TEXTURE GENERATION
 * ============================================================================
 * Generates procedural canvas textures for road asphalt, bump maps,
 * Mediterranean cliffs, environment reflections, and sunset sky dome.
 */

window.TextureGenerator = {
  /**
   * Procedural asphalt with granular road noise, glowing sunset shoulder lines,
   * and 3-lane dashed highway stripes.
   */
  createAsphaltTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');

    // Base asphalt tarmac
    ctx.fillStyle = '#1e1626';
    ctx.fillRect(0, 0, 512, 512);

    // Fine aggregate gravel noise
    for (let i = 0; i < 7000; i++) {
      const v = 22 + Math.floor(Math.random() * 28);
      ctx.fillStyle = `rgb(${v + 10},${v + 2},${v + 14})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 3);
    }

    // Sunset ambient road lighting gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, 'rgba(0,0,0,0.45)');
    grad.addColorStop(0.5, 'rgba(255,190,150,0.18)');
    grad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Glowing Sunset Shoulder Lines (Reflective amber)
    ctx.fillStyle = '#ffbe76';
    ctx.fillRect(20, 0, 9, 512);
    ctx.fillRect(483, 0, 9, 512);

    // Reflective Road Studs / Cat's Eyes along shoulders
    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < 512; y += 32) {
      ctx.fillRect(23, y, 3, 5);
      ctx.fillRect(486, y, 3, 5);
    }

    // 3-Lane Dashed Markings
    ctx.fillStyle = 'rgba(255, 245, 235, 0.94)';
    for (let y = 0; y < 512; y += 64) {
      ctx.fillRect(172, y + 10, 6, 36);
      ctx.fillRect(334, y + 10, 6, 36);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, window.GameConfig.road.textureRepeatZ || 24);
    return tex;
  },

  /**
   * High-contrast asphalt bump/normal displacement map for realistic road micro-grain.
   */
  createAsphaltBumpMap() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 4000; i++) {
      const v = Math.floor(Math.random() * 255);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 48);
    return tex;
  },

  /**
   * Layered limestone & Mediterranean cliff rock texture with scrub patches.
   */
  createCliffTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');

    const g = ctx.createLinearGradient(0, 0, 512, 512);
    g.addColorStop(0, '#593b33');
    g.addColorStop(0.5, '#8c583a');
    g.addColorStop(1, '#3b2829');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);

    // Natural rock strata & vegetation patches
    for (let i = 0; i < 480; i++) {
      ctx.fillStyle = i % 3 === 0 ? 'rgba(45, 72, 42, 0.45)' : 'rgba(255, 175, 105, 0.2)';
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, 4 + Math.random() * 22, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 18);
    return tex;
  },

  /**
   * Radial soft-glow cold-gas cryo condensation plume sprite texture.
   */
  createCryoSpriteTexture() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');

    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.35, 'rgba(220, 248, 255, 0.88)');
    g.addColorStop(0.7, 'rgba(180, 230, 255, 0.35)');
    g.addColorStop(1, 'rgba(180, 230, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);

    return new THREE.CanvasTexture(c);
  },

  /**
   * Golden hour atmospheric gradient for the distant sky dome.
   */
  createSkyTexture() {
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 256;
    skyCanvas.height = 512;
    const sCtx = skyCanvas.getContext('2d');

    const skyGrad = sCtx.createLinearGradient(0, 0, 0, 512);
    skyGrad.addColorStop(0.0, '#1c0b2b');
    skyGrad.addColorStop(0.28, '#6d2b63');
    skyGrad.addColorStop(0.45, '#e86f88');
    skyGrad.addColorStop(0.53, '#ffcb85');
    skyGrad.addColorStop(0.60, '#ffae63');
    skyGrad.addColorStop(1.0, '#2a1636');
    sCtx.fillStyle = skyGrad;
    sCtx.fillRect(0, 0, 256, 512);

    return new THREE.CanvasTexture(skyCanvas);
  },

  /**
   * Equirectangular reflection environment map for high-gloss vehicle clearcoat
   */
  createReflectionEnvMap() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d');

    // Sky to sunset horizon to ground gradient
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0.0, '#231138');
    g.addColorStop(0.45, '#ff7a59');
    g.addColorStop(0.55, '#ffcf70');
    g.addColorStop(0.65, '#351829');
    g.addColorStop(1.0, '#150a1c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);

    // Glowing sun spot reflection
    const sunGrad = ctx.createRadialGradient(180, 60, 2, 180, 60, 36);
    sunGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
    sunGrad.addColorStop(0.4, 'rgba(255,210,120,0.6)');
    sunGrad.addColorStop(1, 'rgba(255,100,50,0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(180, 60, 36, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
  }
};
