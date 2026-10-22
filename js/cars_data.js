/**
 * ============================================================================
 * VEHICLES DATA & GARAGE MANAGER
 * ============================================================================
 * Defines multiple drivable vehicles with unique stats, scale, paint color,
 * and star unlock criteria.
 */

window.CarsManager = (function () {
  const CARS = [
    {
      id: 'dash',
      name: 'Aero Dash',
      size: 'Standard',
      color: 0xdf1d24, // Metallic Candy Crimson
      scale: { x: 1.0, y: 1.0, z: 1.0 },
      mass: 1.0,
      thrusterPower: 9.5,
      gasCapacity: 100,
      durability: 100,
      unlockStars: 0,
      desc: 'Balanced coastal roadster with cryogenic flight thrusters and active aerodynamic wing.'
    },
    {
      id: 'compact',
      name: 'Nano Aero',
      size: 'Compact',
      color: 0x00d4ff, // Electric Cyan
      scale: { x: 0.88, y: 0.88, z: 0.82 },
      mass: 0.75,
      thrusterPower: 11.8,
      gasCapacity: 75,
      durability: 70,
      unlockStars: 3,
      desc: 'Lightweight, ultra-nimble pocket roadster. High agility but limited gas tank.'
    },
    {
      id: 'heavy',
      name: 'Titan Hauler',
      size: 'Heavy',
      color: 0x3e3c45, // Matte Gunmetal
      scale: { x: 1.14, y: 1.1, z: 1.14 },
      mass: 1.45,
      thrusterPower: 8.0,
      gasCapacity: 130,
      durability: 160,
      unlockStars: 6,
      desc: 'Reinforced composite chassis. High collision resistance with high-capacity cryogenic tanks.'
    },
    {
      id: 'hypercar',
      name: 'Apex Prototype',
      size: 'Exotic',
      color: 0xff9100, // Sunset Solar Amber
      scale: { x: 1.05, y: 0.86, z: 1.12 },
      mass: 0.85,
      thrusterPower: 14.2,
      gasCapacity: 110,
      durability: 50,
      unlockStars: 10,
      desc: 'Experimental hypersonic thruster rig with unmatched acceleration, but delicate hull.'
    }
  ];

  let currentCarIndex = 0;

  function init() {
    const savedId = window.GameStorage ? window.GameStorage.getSelectedCarId() : 'dash';
    const foundIdx = CARS.findIndex(c => c.id === savedId);
    currentCarIndex = foundIdx >= 0 ? foundIdx : 0;
    applyCar(CARS[currentCarIndex]);
  }

  function getCars() {
    return CARS;
  }

  function getCurrentCar() {
    return CARS[currentCarIndex];
  }

  function getCarByIndex(idx) {
    if (idx >= 0 && idx < CARS.length) {
      return CARS[idx];
    }
    return CARS[0];
  }

  function isCarUnlocked(car) {
    if (car.unlockStars === 0) return true;
    const totalStars = window.GameStorage ? window.GameStorage.getTotalStars() : 0;
    return totalStars >= car.unlockStars;
  }

  function selectCar(index) {
    if (index >= 0 && index < CARS.length) {
      const car = CARS[index];
      if (isCarUnlocked(car)) {
        currentCarIndex = index;
        if (window.GameStorage) {
          window.GameStorage.setSelectedCarId(car.id);
        }
        applyCar(car);
        return true;
      }
    }
    return false;
  }

  function applyCar(car) {
    if (window.PlayerCar && window.PlayerCar.applyCarProfile) {
      window.PlayerCar.applyCarProfile(car);
    }
    if (window.GameConfig) {
      window.GameConfig.health.maxHealth = car.durability;
      window.GameConfig.fuel.max = car.gasCapacity;
      window.GameConfig.player.mass = car.mass;
    }
  }

  return {
    init,
    getCARS: () => CARS,
    getCurrentCar,
    getCarByIndex,
    isCarUnlocked,
    selectCar,
    applyCar,
    getCurrentIndex: () => currentCarIndex
  };
})();
