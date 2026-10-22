/**
 * ============================================================================
 * AUTOPILOT & RECORDING DEMO AI PILOT
 * ============================================================================
 * Autonomous pilot system that plays both Dash mode (traffic dodge, power-up
 * collection, air stunts) and Parking mode (precision navigation and landing).
 * Perfect for video recording, hands-free demo showcases, and mobile testing.
 */

window.AutopilotAI = (function () {
  let isEnabled = false;
  let stuntTimer = 0;
  let autoTimer = 0;

  function toggle() {
    isEnabled = !isEnabled;
    return isEnabled;
  }

  function setEnabled(val) {
    isEnabled = !!val;
  }

  function getDashInput(state, trafficVehicles, items, dt) {
    if (!isEnabled) return null;

    autoTimer += dt;
    let steer = 0;
    let boost = false;
    let lift = false;
    let slam = false;

    const currentX = state.lateralX;
    const isAirborne = state.airborne;
    const lanes = [-5.8, 0, 5.8];

    // Find traffic obstacles ahead
    let threatInLane = null;
    let minThreatZ = -999;

    if (trafficVehicles && trafficVehicles.length > 0) {
      trafficVehicles.forEach((v) => {
        if (!v || !v.mesh) return;
        const distZ = v.mesh.position.z; // negative is in front
        const distX = v.mesh.position.x - currentX;
        if (distZ < -2 && distZ > -70 && Math.abs(distX) < 2.5) {
          if (distZ > minThreatZ) {
            minThreatZ = distZ;
            threatInLane = v;
          }
        }
      });
    }

    // Check for road power-ups ahead
    let itemTarget = null;
    let minItemZ = -999;
    if (items && items.length > 0) {
      items.forEach((item) => {
        if (!item || !item.mesh) return;
        const distZ = item.mesh.position.z;
        if (distZ < -4 && distZ > -65 && item.mesh.visible) {
          if (distZ > minItemZ) {
            minItemZ = distZ;
            itemTarget = item;
          }
        }
      });
    }

    if (isAirborne) {
      // Perform acrobatic air rolls for high streak stunts
      stuntTimer += dt;
      steer = Math.sin(stuntTimer * 6.0);
      if (state.y > 6.5) {
        slam = true;
      }
    } else {
      stuntTimer = 0;

      if (threatInLane) {
        const threatDist = Math.abs(minThreatZ);

        // Close traffic: Thruster jump over it!
        if (threatDist < 26 && state.fuel > 15) {
          lift = true;
          boost = true;
        } else {
          // Lane shift dodge
          const leftSafe = !trafficVehicles.some(v => v && v.mesh && v.mesh.position.z < -4 && v.mesh.position.z > -55 && Math.abs(v.mesh.position.x - (currentX - 5.5)) < 2.8);
          const rightSafe = !trafficVehicles.some(v => v && v.mesh && v.mesh.position.z < -4 && v.mesh.position.z > -55 && Math.abs(v.mesh.position.x - (currentX + 5.5)) < 2.8);

          if (currentX > 3.0 && leftSafe) {
            steer = -1;
          } else if (currentX < -3.0 && rightSafe) {
            steer = 1;
          } else if (leftSafe) {
            steer = -1;
          } else if (rightSafe) {
            steer = 1;
          } else if (state.fuel > 10) {
            lift = true;
          }
        }
      } else if (itemTarget && !threatInLane) {
        // Collect power-up
        const itemX = itemTarget.mesh.position.x;
        const diffX = itemX - currentX;
        if (Math.abs(diffX) > 0.35) {
          steer = Math.sign(diffX) * Math.min(1.0, Math.abs(diffX) * 0.6);
        }
        if (state.fuel > 35) boost = true;
      } else {
        // Centering in nearest lane
        const nearestLane = lanes.reduce((prev, curr) => Math.abs(curr - currentX) < Math.abs(prev - currentX) ? curr : prev);
        const laneDiff = nearestLane - currentX;
        if (Math.abs(laneDiff) > 0.25) {
          steer = Math.sign(laneDiff) * 0.45;
        }
        // Periodic cryo-boost bursts for high-speed dynamic footage
        if (state.fuel > 40 && Math.sin(autoTimer * 1.5) > 0.2) {
          boost = true;
        }
      }
    }

    return {
      steer,
      pitch: 0,
      boost,
      lift,
      slam,
      isUp: boost,
      isDown: slam
    };
  }

  function getParkingInput(pState, activeLevel, dt) {
    if (!isEnabled || !activeLevel || !activeLevel.bays || activeLevel.bays.length === 0) return null;

    const bay = activeLevel.bays[0];
    const dx = bay.x - pState.x;
    const dz = bay.z - pState.z;
    const dist2D = Math.hypot(dx, dz);

    let thrustFwd = 0;
    let thrustLat = 0;
    let thrustUp = 0;
    let yawInput = 0;

    // Heading stabilization towards bay rotation
    const targetYaw = bay.rotationY || 0;
    const yawDiff = ((pState.yaw - targetYaw) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    if (Math.abs(yawDiff) > 0.06) {
      yawInput = -Math.sign(yawDiff) * 0.8;
    }

    if (dist2D > 0.35) {
      // Approach bay smoothly
      thrustFwd = Math.sign(dz) * Math.min(1.0, Math.abs(dz) * 0.45);
      thrustLat = Math.sign(dx) * Math.min(1.0, Math.abs(dx) * 0.55);

      // Safe cruise altitude (1.4m to 2.4m)
      if (pState.y < 1.4 && pState.gas > 8) {
        thrustUp = 1;
      } else if (pState.y > 2.6) {
        thrustUp = -1;
      }
    } else {
      // Inside bay perimeter: counter-thrust to reach 0 velocity and settle down
      if (Math.abs(pState.vx) > 0.08) thrustLat = -Math.sign(pState.vx) * 0.4;
      if (Math.abs(pState.vz) > 0.08) thrustFwd = -Math.sign(pState.vz) * 0.4;

      // Descend into bay
      if (pState.y > bay.y + 0.12) {
        thrustUp = -0.55;
      }
    }

    return {
      steer: thrustLat,
      pitch: thrustFwd,
      lift: thrustUp > 0,
      slam: thrustUp < 0,
      yawInput
    };
  }

  return {
    toggle,
    setEnabled,
    isEnabled: () => isEnabled,
    getDashInput,
    getParkingInput
  };
})();
