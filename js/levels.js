/**
 * ============================================================================
 * DATA-DRIVEN PARKING LEVELS
 * ============================================================================
 * Defines levels as pure data structures and builds their 3D meshes (slabs,
 * walls, pillars, obstacles, and glowing parking bay targets).
 */

window.LevelManager = (function () {
  const LEVELS = [
    {
      id: 1,
      name: "Open Coastal Lot",
      description: "Gentle thruster landing into an open bay with zero obstacles.",
      parTime: 20,
      startPosition: { x: 0, y: 1.5, z: 22, rotationY: 0 },
      bays: [
        { x: 0, y: 0.04, z: -12, width: 3.4, length: 6.6, rotationY: 0 }
      ],
      obstacles: [],
      wind: { x: 0, z: 0 }
    },
    {
      id: 2,
      name: "Parallel Bay Squeeze",
      description: "Precision parallel park between two parked obstacle cars.",
      parTime: 25,
      startPosition: { x: -6, y: 2.0, z: 18, rotationY: 0 },
      bays: [
        { x: 0, y: 0.04, z: -6, width: 3.2, length: 6.4, rotationY: 0 }
      ],
      obstacles: [
        // Front parked car
        { type: 'car', x: 0, y: 0, z: -13.5, width: 2.3, length: 4.8, height: 1.4, color: 0x42526c },
        // Rear parked car
        { type: 'car', x: 0, y: 0, z: 1.5, width: 2.3, length: 4.8, height: 1.4, color: 0x6e3b4a }
      ],
      wind: { x: 0, z: 0 }
    },
    {
      id: 3,
      name: "Rooftop Helipad",
      description: "Elevated rooftop pad on a towering coastal skyscraper.",
      parTime: 30,
      startPosition: { x: 0, y: 14.0, z: 32, rotationY: 0 },
      bays: [
        { x: 0, y: 12.04, z: 0, width: 3.6, length: 6.8, rotationY: 0 }
      ],
      obstacles: [
        // Massive rooftop building slab
        { type: 'slab', x: 0, y: 6.0, z: 0, width: 22, length: 28, height: 12, color: 0x221a28 }
      ],
      wind: { x: 0, z: 0 }
    },
    {
      id: 4,
      name: "Multi-Level Garage Pillars",
      description: "Navigate narrow concrete support pillars inside a garage floor.",
      parTime: 35,
      startPosition: { x: -8, y: 1.2, z: 24, rotationY: 0 },
      bays: [
        { x: 6, y: 0.04, z: -10, width: 3.2, length: 6.4, rotationY: 0 }
      ],
      obstacles: [
        // Grid of concrete pillars
        { type: 'pillar', x: -4, y: 2.5, z: 8, width: 1.2, length: 1.2, height: 5, color: 0x6c6375 },
        { type: 'pillar', x: 4, y: 2.5, z: 8, width: 1.2, length: 1.2, height: 5, color: 0x6c6375 },
        { type: 'pillar', x: -4, y: 2.5, z: -4, width: 1.2, length: 1.2, height: 5, color: 0x6c6375 },
        { type: 'pillar', x: 4, y: 2.5, z: -4, width: 1.2, length: 1.2, height: 5, color: 0x6c6375 },
        { type: 'wall', x: 0, y: 2.5, z: -18, width: 24, length: 1.0, height: 5, color: 0x3d3047 }
      ],
      wind: { x: 0, z: 0 }
    },
    {
      id: 5,
      name: "Alleyway Cross-Traffic",
      description: "Tight urban alley with active moving cross-traffic.",
      parTime: 35,
      startPosition: { x: 0, y: 1.5, z: 26, rotationY: 0 },
      bays: [
        { x: 0, y: 0.04, z: -18, width: 3.2, length: 6.4, rotationY: 0 }
      ],
      obstacles: [
        // Left & right alley buildings
        { type: 'wall', x: -6.5, y: 4, z: 0, width: 4, length: 45, height: 8, color: 0x2b1d33 },
        { type: 'wall', x: 6.5, y: 4, z: 0, width: 4, length: 45, height: 8, color: 0x2b1d33 }
      ],
      wind: { x: 0, z: 0 },
      hasMovingTraffic: true
    },
    {
      id: 6,
      name: "Wind Gust Apex",
      description: "High-altitude coastal cliff with gusting crosswinds and a tight clock.",
      parTime: 22,
      startPosition: { x: -7, y: 3.0, z: 25, rotationY: 0 },
      bays: [
        { x: 6, y: 0.04, z: -12, width: 3.4, length: 6.6, rotationY: 0 }
      ],
      obstacles: [
        { type: 'slab', x: 0, y: 1.5, z: 5, width: 8, length: 8, height: 3, color: 0x483238 }
      ],
      wind: { x: 4.8, z: -1.2 }
    }
  ];

  let currentLevelIndex = 0;
  const levelGroup = new THREE.Group();
  let bayMeshes = [];
  let obstacleBoxes = [];

  function buildLevelMeshes(scene, levelData) {
    // Clear previous level objects
    while (levelGroup.children.length > 0) {
      levelGroup.remove(levelGroup.children[0]);
    }
    bayMeshes = [];
    obstacleBoxes = [];

    // Base ground slab for the parking lot
    const lotGeo = new THREE.PlaneGeometry(60, 90);
    lotGeo.rotateX(-Math.PI / 2);
    const lotMat = new THREE.MeshStandardMaterial({
      color: 0x201726,
      roughness: 0.35,
      metalness: 0.2
    });
    const lotMesh = new THREE.Mesh(lotGeo, lotMat);
    lotMesh.receiveShadow = true;
    levelGroup.add(lotMesh);

    // Build glowing neon parking bays
    levelData.bays.forEach((bay) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(bay.x, bay.y, bay.z);
      bGroup.rotation.y = bay.rotationY || 0;

      // Outer outline box
      const outlineGeo = new THREE.PlaneGeometry(bay.width, bay.length);
      outlineGeo.rotateX(-Math.PI / 2);
      const outlineMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.65,
        wireframe: true
      });
      const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
      bGroup.add(outlineMesh);

      // Glowing corner brackets
      const cornerMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
      const hw = bay.width / 2;
      const hl = bay.length / 2;
      [[-hw, -hl], [hw, -hl], [-hw, hl], [hw, hl]].forEach(([cx, cz]) => {
        const cMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.6), cornerMat);
        cMesh.position.set(cx, 0.02, cz);
        bGroup.add(cMesh);
      });

      // Target center icon
      const centerDisc = new THREE.Mesh(
        new THREE.RingGeometry(0.4, 0.55, 16),
        new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide })
      );
      centerDisc.rotateX(-Math.PI / 2);
      centerDisc.position.y = 0.03;
      bGroup.add(centerDisc);

      levelGroup.add(bGroup);
      bayMeshes.push({ group: bGroup, outlineMesh, data: bay });
    });

    // Build obstacle boxes
    levelData.obstacles.forEach((obs) => {
      const oMat = new THREE.MeshStandardMaterial({
        color: obs.color || 0x443552,
        roughness: 0.45,
        metalness: 0.3
      });
      const oMesh = new THREE.Mesh(new THREE.BoxGeometry(obs.width, obs.height, obs.length), oMat);
      oMesh.position.set(obs.x, obs.y, obs.z);
      oMesh.castShadow = true;
      oMesh.receiveShadow = true;
      levelGroup.add(oMesh);

      obstacleBoxes.push({
        mesh: oMesh,
        minX: obs.x - obs.width / 2,
        maxX: obs.x + obs.width / 2,
        minY: obs.y - obs.height / 2,
        maxY: obs.y + obs.height / 2,
        minZ: obs.z - obs.length / 2,
        maxZ: obs.z + obs.length / 2
      });
    });

    if (!scene.children.includes(levelGroup)) {
      scene.add(levelGroup);
    }
  }

  function setBayGlowColor(isAligned, progress) {
    bayMeshes.forEach((b) => {
      if (progress >= 1.0) {
        // Successfully parked: vibrant emerald green!
        b.outlineMesh.material.color.setHex(0x00e676);
      } else if (isAligned) {
        // Aligning inside bay: pulsing amber-yellow
        b.outlineMesh.material.color.setHex(0xffd54f);
      } else {
        // Idle search: cyan
        b.outlineMesh.material.color.setHex(0x00e5ff);
      }
    });
  }

  function loadLevel(scene, index) {
    currentLevelIndex = Math.max(0, Math.min(LEVELS.length - 1, index));
    const data = LEVELS[currentLevelIndex];
    buildLevelMeshes(scene, data);
    return data;
  }

  function getCurrentLevelData() {
    return LEVELS[currentLevelIndex];
  }

  function getLevelGroup() {
    return levelGroup;
  }

  function getObstacles() {
    return obstacleBoxes;
  }

  function getBays() {
    return bayMeshes;
  }

  function setVisible(visible) {
    levelGroup.visible = visible;
  }

  return {
    LEVELS,
    loadLevel,
    getCurrentLevelData,
    getLevelGroup,
    getObstacles,
    getBays,
    setBayGlowColor,
    setVisible,
    getIndex: () => currentLevelIndex
  };
})();
