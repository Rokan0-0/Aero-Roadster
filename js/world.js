/**
 * ============================================================================
 * WORLD & ENVIRONMENT SETUP (OPTIMIZED FOR 60FPS SMOOTHNESS)
 * ============================================================================
 * Builds the coastal highway, lighting, sunset sky, Mediterranean cliffs,
 * ocean waters, golden beach, roadside palms, and pipe barriers.
 */

window.GameWorld = (function () {
  const config = window.GameConfig;
  const colors = config.colors;
  const roadConf = config.road;

  let scene, renderer;
  let sunLight;
  let roadMesh, glareMesh;
  let asphaltTex, cliffTex;
  let baseRoadX, baseGlareX;
  const roadsideProps = [];

  /**
   * Road curvature calculation.
   * Anchored at z = 0 where the player car sits so the highway never slides
   * out from beneath the car.
   */
  function curveX(z, phase) {
    return Math.sin(z * roadConf.curveFrequency + phase) * (z * roadConf.curveAmplitude);
  }

  function createPalmTree(trunkMat, frondMat) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.45, 9.5, 7), trunkMat);
    trunk.position.y = 4.75;
    trunk.rotation.z = 0.12;
    g.add(trunk);

    const crown = new THREE.Group();
    crown.position.set(-0.6, 9.3, 0);
    for (let i = 0; i < 7; i++) {
      const frondGeo = new THREE.ConeGeometry(1.1, 4.6, 4);
      frondGeo.rotateX(Math.PI / 2.3);
      const frond = new THREE.Mesh(frondGeo, frondMat);
      const angle = (i / 7) * Math.PI * 2;
      frond.rotation.y = angle;
      frond.position.set(Math.cos(angle) * 1.4, -0.2, Math.sin(angle) * 1.4);
      crown.add(frond);
    }
    g.add(crown);
    return g;
  }

  function createPipeBarrierSegment(railMat) {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.2, 0.35), railMat);
    post.position.y = 1.6;
    g.add(post);
    for (let h = 0.8; h <= 2.8; h += 0.9) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 18, 8), railMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(0, h, 0);
      g.add(pipe);
    }
    return g;
  }

  function init(targetScene, targetRenderer) {
    scene = targetScene;
    renderer = targetRenderer;

    // Atmospheric Fog
    scene.fog = new THREE.FogExp2(colors.fog, colors.fogDensity);

    // 1. Sky Dome
    const skyGeo = new THREE.SphereGeometry(750, 32, 24);
    const skyTex = window.TextureGenerator.createSkyTexture();
    const skyMesh = new THREE.Mesh(
      skyGeo,
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
    );
    scene.add(skyMesh);

    // 2. Sunset Sun Disc & Halo
    const sunGroup = new THREE.Group();
    const sunDisc = new THREE.Mesh(
      new THREE.CircleGeometry(42, 32),
      new THREE.MeshBasicMaterial({ color: colors.sunDisc, fog: false })
    );
    const sunHalo = new THREE.Mesh(
      new THREE.CircleGeometry(115, 32),
      new THREE.MeshBasicMaterial({ color: colors.sunHalo, transparent: true, opacity: 0.35, fog: false })
    );
    sunHalo.position.z = -1;
    sunGroup.add(sunDisc, sunHalo);
    sunGroup.position.set(-75, 56, -620);
    scene.add(sunGroup);

    // 3. Environmental Lighting
    const hemiLight = new THREE.HemisphereLight(colors.hemisphereSky, colors.hemisphereGround, 0.88);
    scene.add(hemiLight);

    sunLight = new THREE.DirectionalLight(colors.sunLight, 1.65);
    sunLight.position.set(-60, 75, -140);
    sunLight.castShadow = true;
    const d = 45;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    // 4. Highway Asphalt Road & Glare Strip (Silky smooth standard shader)
    asphaltTex = window.TextureGenerator.createAsphaltTexture();
    cliffTex = window.TextureGenerator.createCliffTexture();

    const roadGeo = new THREE.PlaneGeometry(roadConf.width, roadConf.length, 16, 180);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.24,
      metalness: 0.35
    });
    roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    const glareGeo = new THREE.PlaneGeometry(3.2, roadConf.length, 1, 80);
    glareGeo.rotateX(-Math.PI / 2);
    const glareMat = new THREE.MeshBasicMaterial({
      color: 0xffe4c4,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending
    });
    glareMesh = new THREE.Mesh(glareGeo, glareMat);
    glareMesh.position.y = 0.03;
    scene.add(glareMesh);

    // Cache initial X positions for spline deformation
    baseRoadX = new Float32Array(roadGeo.attributes.position.count);
    for (let i = 0; i < baseRoadX.length; i++) baseRoadX[i] = roadGeo.attributes.position.getX(i);

    baseGlareX = new Float32Array(glareGeo.attributes.position.count);
    for (let i = 0; i < baseGlareX.length; i++) baseGlareX[i] = glareGeo.attributes.position.getX(i);

    // 5. Left Sea-Wall Guardrail, Golden Beach & Ocean
    const leftRailGeo = new THREE.BoxGeometry(0.45, 0.9, roadConf.length);
    const railMat = new THREE.MeshStandardMaterial({ color: colors.guardrail, metalness: 0.75, roughness: 0.25 });
    const leftGuardrail = new THREE.Mesh(leftRailGeo, railMat);
    leftGuardrail.position.set(-roadConf.width / 2 + 0.3, 0.45, 0);
    scene.add(leftGuardrail);

    const beachGeo = new THREE.PlaneGeometry(46, roadConf.length, 8, 90);
    beachGeo.rotateX(-Math.PI / 2);
    const beachMesh = new THREE.Mesh(beachGeo, new THREE.MeshStandardMaterial({ color: colors.beach, roughness: 0.75 }));
    beachMesh.position.set(-roadConf.width / 2 - 21, -2.6, 0);
    scene.add(beachMesh);

    const oceanGeo = new THREE.PlaneGeometry(900, roadConf.length, 40, 80);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMesh = new THREE.Mesh(oceanGeo, new THREE.MeshStandardMaterial({
      color: colors.ocean,
      emissive: colors.oceanEmissive,
      roughness: 0.14,
      metalness: 0.68
    }));
    oceanMesh.position.set(-460, -3.2, 0);
    scene.add(oceanMesh);

    // 6. Right Mediterranean Rocky Cliffs
    const cliffGeo = new THREE.PlaneGeometry(140, roadConf.length, 28, 120);
    cliffGeo.rotateX(-Math.PI / 2);
    const cliffPos = cliffGeo.attributes.position;
    for (let i = 0; i < cliffPos.count; i++) {
      const lx = cliffPos.getX(i);
      const lz = cliffPos.getZ(i);
      const t = (lx + 70) / 140;
      const crag = Math.sin(lz * 0.06 + lx * 0.12) * 4.5 + Math.cos(lz * 0.15) * 2.2;
      cliffPos.setY(i, Math.pow(t, 1.25) * 95 + (t > 0.08 ? crag : 0));
    }
    cliffGeo.computeVertexNormals();
    const cliffMesh = new THREE.Mesh(cliffGeo, new THREE.MeshStandardMaterial({ map: cliffTex, roughness: 0.88, metalness: 0.08 }));
    cliffMesh.position.set(roadConf.width / 2 + 69, -0.3, 0);
    scene.add(cliffMesh);

    // 7. Distant Coastal Bay Headlands
    const mountainGroup = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(85 + i * 25, 110 + i * 18, 7),
        new THREE.MeshLambertMaterial({ color: 0x4b294c })
      );
      m.position.set(-140 + i * 65, 35, -520 - i * 30);
      m.scale.set(1.8, 1, 1.2);
      mountainGroup.add(m);
    }
    scene.add(mountainGroup);

    // 8. Roadside Palms & Industrial Pipe Barriers
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x2d1729 });
    const frondMat = new THREE.MeshLambertMaterial({ color: 0x231426, side: THREE.DoubleSide });

    for (let z = 40; z > -420; z -= 18) {
      const palm = createPalmTree(trunkMat, frondMat);
      const pipes = createPipeBarrierSegment(railMat);
      scene.add(palm);
      scene.add(pipes);
      roadsideProps.push({ palm, pipes, zOffset: z });
    }
  }

  function updateRoadSpline(phase) {
    const rPos = roadMesh.geometry.attributes.position;
    for (let i = 0; i < rPos.count; i++) {
      const z = rPos.getZ(i);
      rPos.setX(i, baseRoadX[i] + curveX(z, phase));
    }
    rPos.needsUpdate = true;

    const gPos = glareMesh.geometry.attributes.position;
    for (let i = 0; i < gPos.count; i++) {
      const z = gPos.getZ(i);
      gPos.setX(i, baseGlareX[i] - 2.2 + curveX(z, phase));
    }
    gPos.needsUpdate = true;
  }

  function updateScenery(distanceZ, speed, dt, curvePhase) {
    asphaltTex.offset.y = -(distanceZ * 0.045) % 1;
    cliffTex.offset.y = -(distanceZ * 0.012) % 1;

    updateRoadSpline(curvePhase);

    roadsideProps.forEach((p) => {
      p.zOffset += speed * dt;
      if (p.zOffset > 30) p.zOffset -= 450;
      const cx = curveX(p.zOffset, curvePhase);
      p.palm.position.set(cx - roadConf.width / 2 - 2.2, 0, p.zOffset);
      p.pipes.position.set(cx + roadConf.width / 2 + 0.6, 0, p.zOffset);
    });
  }

  function applyQuality(tier) {
    if (!renderer || !sunLight) return;
    if (tier === 'ULTRA') {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      renderer.shadowMap.enabled = true;
      sunLight.shadow.mapSize.set(2048, 2048);
    } else if (tier === 'HIGH') {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.shadowMap.enabled = true;
      sunLight.shadow.mapSize.set(1024, 1024);
    } else {
      renderer.setPixelRatio(1.0);
      renderer.shadowMap.enabled = false;
    }
  }

  return {
    init,
    curveX,
    updateScenery,
    applyQuality
  };
})();
