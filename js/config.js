/**
 * ============================================================================
 * GAME CONFIGURATION & TUNING PARAMETERS
 * ============================================================================
 * All major game settings, speeds, physics constants, stunt rewards, items,
 * and visual styling colors are centralized here for easy tuning and modification.
 */

window.GameConfig = {
  // --------------------------------------------------------------------------
  // ROAD & HIGHWAY DIMENSIONS
  // --------------------------------------------------------------------------
  road: {
    width: 22,
    safeHalfWidth: 8.9, // Lateral boundary keeping car inside guardrails on ground
    length: 900,
    lanePositions: [-5.8, 0, 5.8], // 3 distinct driving lanes
    curveAmplitude: -0.025,
    curveFrequency: 0.0045,
    textureRepeatZ: 24,
  },

  // --------------------------------------------------------------------------
  // PLAYER CAR SPEEDS & HANDLING
  // --------------------------------------------------------------------------
  player: {
    baseSpeed: 138,         // Cruising speed (mph)
    boostSpeed: 235,        // Top boost speed (mph)
    feverSpeed: 275,        // Hypersonic rocket fever speed
    accelerationLerp: 3.5,  // Acceleration transition responsiveness
    steerSpeedGround: 24.0, // Steering agility on tarmac
    steerSpeedAir: 14.0,    // Lateral drift control while airborne
    steerLerp: 8.0,         // Steering smoothing
    groundAutoCenter: 0.85, // Dampening multiplier to auto-center when no input
    guardrailBounce: -0.3,  // Velocity reflection when touching guardrail
  },

  // --------------------------------------------------------------------------
  // HULL INTEGRITY, HEALTH & DAMAGE
  // --------------------------------------------------------------------------
  health: {
    maxHealth: 100,
    hitDamage: 34,          // ~3 hits before total crash
    invulnerabilityAfterHit: 1.6, // Seconds of blinking immunity after taking damage
  },

  // --------------------------------------------------------------------------
  // AIR THRUSTERS, AERODYNAMICS & GRAVITY
  // --------------------------------------------------------------------------
  physics: {
    gravity: 24.5,           // Downward gravity acceleration
    jumpImpulse: 14.5,       // Initial upward velocity on Space/LIFT
    airContinuousThrust: 32.0, // Sustained upward cold-gas thrust
    maxAirVelocityY: 18.0,   // Maximum upward vertical climb rate
    slamVelocity: -34.0,     // Downward dive speed on C/SLAM
    rollRate: 5.8,           // Barrel roll rotation speed
    pitchRate: 4.4,          // Flip pitch rotation speed
    landingTolerance: 0.65,  // Radians offset within which landing is "Perfect"
    autoLevelSpeed: 4.0,     // Smoothing back to upright flight when sticks idle
  },

  // --------------------------------------------------------------------------
  // COLD-GAS FUEL / AIR SYSTEM
  // --------------------------------------------------------------------------
  fuel: {
    initial: 100,
    max: 100,
    boostDrainRate: 20.0,    // Fuel drained per second on cryo boost
    liftDrainRate: 20.0,     // Fuel drained per second on thruster jump
    comboDrainRate: 32.0,    // Fuel drained when boosting & lifting together
    rechargeRate: 12.0,      // Passive fuel regeneration per second on ground
  },

  // --------------------------------------------------------------------------
  // COLLECTIBLE ROAD ITEMS / POWER-UPS (ROADSTER DASH INSPIRED)
  // --------------------------------------------------------------------------
  items: {
    spawnIntervalDistance: 120, // Spawn every ~120m traveled
    types: {
      air: {
        name: 'AIR CANISTER',
        icon: '⚡',
        color: 0x4dd0e1,
        desc: 'Cold-gas thrusters refilled to 100%!',
        duration: 0
      },
      shield: {
        name: 'STARMAN SHIELD',
        icon: '⭐',
        color: 0xffd54f,
        desc: 'Invincible! Plow through traffic!',
        duration: 7.0 // Seconds of invincibility
      },
      rocket: {
        name: 'ROCKET FEVER',
        icon: '🚀',
        color: 0xff4081,
        desc: 'Hyper-speed & 2x Stunt Multiplier!',
        duration: 5.5 // Seconds of warp speed
      }
    }
  },

  // --------------------------------------------------------------------------
  // STUNT POINTS & FUEL BONUSES
  // --------------------------------------------------------------------------
  stunts: {
    barrelRoll:    { name: 'BARREL ROLL',      points: 220, fuelBonus: 28 },
    zeroGFlip:     { name: 'ZERO-G FLIP',      points: 300, fuelBonus: 30 },
    perfectLanding:{ name: 'PERFECT LANDING',  points: 400, fuelBonus: 22 },
    airClear:      { name: 'AIR CLEAR + BOOST',points: 250, fuelBonus: 35 },
    trafficLaunch: { name: 'TRAFFIC LAUNCH',   points: 110, fuelBonus: 15 },
    nearMiss:      { name: 'NEAR MISS',        points: 90,  fuelBonus: 10 },
    slam:          { name: 'THRUSTER SLAM',    points: 150, fuelBonus: 8  },
    trafficSmash:  { name: 'SHIELD SMASH',     points: 350, fuelBonus: 40 },
  },

  // --------------------------------------------------------------------------
  // AI TRAFFIC SETTINGS
  // --------------------------------------------------------------------------
  traffic: {
    count: 7,
    baseSpeed: 55,
    speedVariation: 14,
    spawnDistanceZ: -380,
    spawnJitterZ: 90,
    despawnDistanceZ: 28,
    colors: [0x384967, 0x5c3c58, 0x2e5259, 0x6b3e3e, 0x1f3c58],
  },

  // --------------------------------------------------------------------------
  // CAMERA BEHAVIOR & SHAKE
  // --------------------------------------------------------------------------
  camera: {
    defaultFov: 62,
    boostFov: 74,
    feverFov: 82,
    fovLerp: 5.0,
    followDistanceZ: 8.8,
    camTargetXLerp: 7.0,
    camTargetYLerp: 7.0,
    baseHeight: 3.15,
  },

  // --------------------------------------------------------------------------
  // CONCEPT CAMERA PRESETS
  // --------------------------------------------------------------------------
  conceptPresets: [
    null,
    {
      title: 'Concept Render 1: "Golden Hour Barrel Roll" (IMG_8338 Hero Shot)',
      desc: 'Tessa Roadshow airborne mid-barrel roll with white cold-gas condensation plumes & sunset glare.'
    },
    {
      title: 'Concept Render 2: "Coastal Cliffside Apex" (Mediterranean Coast)',
      desc: 'Wide golden-hour vista showing turquoise ocean, coastal palms, and towering limestone cliffs.'
    },
    {
      title: 'Concept Render 3: "SpaceX Cold-Gas Thruster & Active Wing Close-Up"',
      desc: 'Low rear-quarter angle highlighting deployed active rear wing and high-velocity cryo plumes.'
    }
  ],

  // --------------------------------------------------------------------------
  // COLOR PALETTE & MATERIAL TONES
  // --------------------------------------------------------------------------
  colors: {
    fog: 0xd66874,
    fogDensity: 0.0021,
    hemisphereSky: 0xffb6c1,
    hemisphereGround: 0x38203c,
    sunLight: 0xffb478,
    sunDisc: 0xfff3cc,
    sunHalo: 0xff9466,
    ocean: 0x0f8ca8,
    oceanEmissive: 0x16394d,
    beach: 0xd9a066,
    guardrail: 0xd8c8e8,
    playerPaint: 0xf5f8fc,
    canopyGlass: 0x0a0c14,
    carbonFiber: 0x171820,
    tailLight: 0xff2a4b,
    headlightGlow: 0xd8f4ff,
    thrusterLight: 0xbbf2ff,
  },

  // --------------------------------------------------------------------------
  // OPTIONAL EXTERNAL 3D GLTF MODEL HOOK
  // --------------------------------------------------------------------------
  // Set to a .glb URL if you wish to load an external Roadster 3D file, e.g.:
  // gltfModelUrl: 'models/tesla_roadster.glb'
  gltfModelUrl: null
};
