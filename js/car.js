/**
 * ============================================================================
 * PLAYER VEHICLE: TESSA ROADSHOW (ORIGINAL CLEAN 3D MODEL)
 * ============================================================================
 * The original beloved Tessa Roadshow 3D vehicle model with sculpted aerodynamic
 * hull, teardrop glass canopy, carbon splitter, triple nozzles, active wing,
 * and high-speed rolling wheels.
 */

window.PlayerCar = (function () {
  const config = window.GameConfig;

  let playerCar;
  let carVisual;
  let bodyPaintMat;
  let activeWingGroup;
  let wingBlade;
  let thrusterLight;
  let shieldMesh;
  const wheels = [];

  function buildCar(scene) {
    playerCar = new THREE.Group();
    carVisual = new THREE.Group();
    playerCar.add(carVisual);
    scene.add(playerCar);

    // Exact original material palette
    bodyPaintMat = new THREE.MeshStandardMaterial({
      color: 0xdf1d24,
      metalness: 0.75,
      roughness: 0.16
    });

    const canopyGlassMat = new THREE.MeshStandardMaterial({
      color: 0x11131c,
      metalness: 0.92,
      roughness: 0.06
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x171820,
      roughness: 0.48,
      metalness: 0.42
    });

    // 1. Original Aerodynamic Hull
    const hullGeo = new THREE.BoxGeometry(2.35, 0.62, 4.9, 2, 1, 4);
    const hPos = hullGeo.attributes.position;
    for (let i = 0; i < hPos.count; i++) {
      const z = hPos.getZ(i);
      const y = hPos.getY(i);
      const x = hPos.getX(i);
      if (z < -1.2 && y > 0) {
        hPos.setY(i, y * 0.35);
        hPos.setX(i, x * 0.9);
      }
      if (z > 1.5 && y > 0) {
        hPos.setY(i, y + 0.12);
      }
    }
    hullGeo.computeVertexNormals();
    const hullMesh = new THREE.Mesh(hullGeo, bodyPaintMat);
    hullMesh.position.y = 0.62;
    hullMesh.castShadow = true;
    carVisual.add(hullMesh);

    // 2. Original Teardrop Canopy Glass
    const canopyGeo = new THREE.CylinderGeometry(0.75, 1.08, 2.75, 6);
    canopyGeo.rotateX(Math.PI / 2);
    canopyGeo.scale(1.0, 0.48, 1.0);
    const canopyMesh = new THREE.Mesh(canopyGeo, canopyGlassMat);
    canopyMesh.position.set(0, 1.02, -0.05);
    carVisual.add(canopyMesh);

    // 3. Original Carbon Front Splitter
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.14, 4.98), carbonMat);
    splitter.position.y = 0.32;
    carVisual.add(splitter);

    // 4. Original Cyber Red Tail Light Bar
    const tailBar = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 0.1, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xff2a4b })
    );
    tailBar.position.set(0, 0.86, 2.46);
    carVisual.add(tailBar);

    // 5. Original Triple Cold-Gas Exhaust Nozzles
    const nozzleGroup = new THREE.Group();
    for (let nx of [-0.55, 0, 0.55]) {
      const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.35, 12), carbonMat);
      noz.rotation.x = Math.PI / 2;
      noz.position.set(nx, 0.72, 2.48);
      nozzleGroup.add(noz);
    }
    carVisual.add(nozzleGroup);

    // 6. Original Active Aerodynamic Rear Wing
    activeWingGroup = new THREE.Group();
    activeWingGroup.position.set(0, 0.96, 2.15);
    wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.08, 0.58), bodyPaintMat);
    wingBlade.rotation.x = 0.18;
    const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.38, 0.28), carbonMat);
    strutL.position.set(-0.65, -0.16, 0);
    const strutR = strutL.clone();
    strutR.position.x = 0.65;
    activeWingGroup.add(wingBlade, strutL, strutR);
    carVisual.add(activeWingGroup);

    // 7. Original Spoke Sport Wheels
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x121318, roughness: 0.7 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd8e0ec, metalness: 0.85, roughness: 0.2 });
    const wheelPositions = [
      [-1.16, 0.44, -1.52],
      [1.16, 0.44, -1.52],
      [-1.16, 0.46, 1.52],
      [1.16, 0.46, 1.52]
    ];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wGroup = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.34, 20), tireMat);
      tire.rotation.z = Math.PI / 2;
      wGroup.add(tire);
      for (let s = 0; s < 5; s++) {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.38), rimMat);
        spoke.rotation.x = (s / 5) * Math.PI * 2;
        wGroup.add(spoke);
      }
      wGroup.position.set(wx, wy, wz);
      carVisual.add(wGroup);
      wheels.push(wGroup);
    });

    // 8. Dynamic Thruster Glow PointLight
    thrusterLight = new THREE.PointLight(0xbbf2ff, 0, 14);
    thrusterLight.position.set(0, 0.5, 2.2);
    carVisual.add(thrusterLight);

    // 9. Soft Starman Shield Aura
    const shieldGeo = new THREE.SphereGeometry(3.0, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0xffd54f,
      transparent: true,
      opacity: 0,
      wireframe: true
    });
    shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.y = 0.8;
    carVisual.add(shieldMesh);
  }

  function updateWing(wingDeploy) {
    if (!activeWingGroup || !wingBlade) return;
    activeWingGroup.position.y = 0.94 + wingDeploy * 0.25;
    wingBlade.rotation.x = 0.12 + wingDeploy * 0.22;
  }

  function updateWheels(speed, dt) {
    wheels.forEach((w) => {
      w.rotation.x -= speed * dt * 0.35;
    });
  }

  function setThrusterIntensity(intensity) {
    if (thrusterLight) thrusterLight.intensity = intensity;
  }

  function setShieldAura(active) {
    if (!shieldMesh) return;
    if (active) {
      shieldMesh.visible = true;
      shieldMesh.material.opacity = 0.35 + Math.sin(Date.now() * 0.01) * 0.2;
      shieldMesh.rotation.y += 0.03;
      const hue = (Date.now() * 0.0015) % 1;
      shieldMesh.material.color.setHSL(hue, 1.0, 0.6);
    } else {
      shieldMesh.visible = false;
      shieldMesh.material.opacity = 0;
    }
  }

  function applyCarProfile(carData) {
    if (bodyPaintMat && carData.color !== undefined) {
      bodyPaintMat.color.setHex(carData.color);
    }
    if (carVisual && carData.scale) {
      carVisual.scale.set(carData.scale.x, carData.scale.y, carData.scale.z);
    }
  }

  return {
    init: buildCar,
    getCar: () => playerCar,
    getVisual: () => carVisual,
    getActiveWing: () => activeWingGroup,
    updateWing,
    updateWheels,
    setThrusterIntensity,
    setShieldAura,
    applyCarProfile
  };
})();
