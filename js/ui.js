/**
 * ============================================================================
 * HUD, SCORE & UI CONTROLLER (STATE MACHINE INTEGRATED)
 * ============================================================================
 * Coordinates Lobby, HUD, Parking Result Modal, Pause Menu, Game Over Modal,
 * and Share clipboard functionality.
 */

window.UIController = (function () {
  const config = window.GameConfig;
  const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  let qualityTier = isMobileDevice ? 'HIGH' : 'ULTRA';
  let totalScore = 0;
  let pendingScore = 0;
  let streak = 1;
  let streakTimer = 1.0;
  let conceptMode = 0;
  let distanceMeters = 0;

  // LocalStorage All-Time Records
  let bestScore = parseInt(localStorage.getItem('tessa_best_score') || '0', 10);
  let bestDist = parseInt(localStorage.getItem('tessa_best_dist') || '0', 10);

  // DOM Elements
  let lobbyScreen, playDashBtn, parkingModeBtn, garageBtn, leaderboardBtn, settingsBtn, aboutBtn, autoDemoBtn;
  let hudEl, touchControlsEl;
  let pauseBtn, pauseModal, pauseResumeBtn, pauseRestartBtn, pauseQuitBtn;
  let scoreEl, streakMultEl, streakCountEl, streakFillEl, pendingEl, stuntFeedEl;
  let speedNumEl, aeroStatusEl, airBarInner, fuelPctEl, fxOverlay;
  let gfxBtn, recenterBtn, conceptBtn, conceptBanner, conceptTitle, conceptDesc, autopilotBtn, autopilotBanner;
  let distEl, hullFillEl, hullPctEl, itemBadgeEl, muteBtn;
  let gameOverModal, goDistEl, goScoreEl, goBestDistEl, goBestScoreEl, retryBtn, goLobbyBtn;
  let parkingHudPill;
  let parkingDevModal, parkingDevCloseBtn, parkingDevPlayBtn;
  let pauseMuteBtn, pauseGfxBtn, pauseAutopilotBtn, pauseRecenterBtn, pauseConceptBtn, pauseFsBtn;

  // Level Select & Garage Elements
  let levelSelectModal, levelGridEl, levelSelectCloseBtn;
  let garageModal, garagePrevBtn, garageNextBtn, garageCarName, garageCarDesc;
  let garageStatThruster, garageStatDurability, garageStatGas, garageStatAgility;
  let garageSelectBtn, garageCloseBtn;
  let previewCarIndex = 0;

  // Result Modal Elements
  let resultModal, resultTitle, resultLevelName, resultStars, resultTime, resultPar, resultGas, resultHull;
  let resultRetryBtn, resultNextBtn, resultLobbyBtn, resultShareBtn, shareToast;
  // Registered Subsystem Callbacks
  let cbRecenter = null;
  let cbQualityChange = null;
  let cbRestartDash = null;
  let cbRetryParking = null;
  let cbNextLevelParking = null;
  let cbStartParkingLevel = null;

  function init(onRecenter, onQualityChange, onRestartDash, onRetryParking, onNextLevelParking, onStartParkingLevel) {
    cbRecenter = onRecenter;
    cbQualityChange = onQualityChange;
    cbRestartDash = onRestartDash;
    cbRetryParking = onRetryParking;
    cbNextLevelParking = onNextLevelParking;
    cbStartParkingLevel = onStartParkingLevel;

    // 1. Lobby & Main Menus
    lobbyScreen = document.getElementById('lobby-screen');
    playDashBtn = document.getElementById('play-dash-btn');
    parkingModeBtn = document.getElementById('parking-mode-btn');
    garageBtn = document.getElementById('garage-btn');
    leaderboardBtn = document.getElementById('leaderboard-btn');
    settingsBtn = document.getElementById('settings-btn');
    aboutBtn = document.getElementById('about-btn');

    // Level Select & Garage DOM
    levelSelectModal = document.getElementById('level-select-modal');
    levelGridEl = document.getElementById('level-grid');
    levelSelectCloseBtn = document.getElementById('level-select-close-btn');

    garageModal = document.getElementById('garage-modal');
    garagePrevBtn = document.getElementById('garage-prev-btn');
    garageNextBtn = document.getElementById('garage-next-btn');
    garageCarName = document.getElementById('garage-car-name');
    garageCarDesc = document.getElementById('garage-car-desc');
    garageStatThruster = document.getElementById('garage-stat-thruster');
    garageStatDurability = document.getElementById('garage-stat-durability');
    garageStatGas = document.getElementById('garage-stat-gas');
    garageStatAgility = document.getElementById('garage-stat-agility');
    garageSelectBtn = document.getElementById('garage-select-btn');
    garageCloseBtn = document.getElementById('garage-close-btn');

    // 2. HUD & Mobile Controls
    hudEl = document.getElementById('hud');
    touchControlsEl = document.getElementById('touch-controls');
    parkingHudPill = document.getElementById('parking-hud-pill');

    // 3. Pause Elements
    pauseBtn = document.getElementById('pause-btn');
    pauseModal = document.getElementById('pause-modal');
    pauseResumeBtn = document.getElementById('pause-resume-btn');
    pauseRestartBtn = document.getElementById('pause-restart-btn');
    pauseQuitBtn = document.getElementById('pause-quit-btn');

    pauseMuteBtn = document.getElementById('pause-mute-btn');
    pauseGfxBtn = document.getElementById('pause-gfx-btn');
    pauseAutopilotBtn = document.getElementById('pause-autopilot-btn');
    pauseRecenterBtn = document.getElementById('pause-recenter-btn');
    pauseConceptBtn = document.getElementById('pause-concept-btn');
    pauseFsBtn = document.getElementById('pause-fs-btn');

    parkingDevModal = document.getElementById('parking-dev-modal');
    parkingDevCloseBtn = document.getElementById('parking-dev-close-btn');
    parkingDevPlayBtn = document.getElementById('parking-dev-play-btn');

    // 4. Stunt & Readout Elements
    scoreEl = document.getElementById('score-value');
    streakMultEl = document.getElementById('streak-mult');
    streakCountEl = document.getElementById('streak-count');
    streakFillEl = document.getElementById('streak-bar-fill');
    pendingEl = document.getElementById('pending-points');
    stuntFeedEl = document.getElementById('stunt-feed');
    speedNumEl = document.getElementById('speed-num');
    aeroStatusEl = document.getElementById('aero-status');
    airBarInner = document.getElementById('air-bar-inner');
    fuelPctEl = document.getElementById('fuel-pct');
    fxOverlay = document.getElementById('fx-overlay');

    distEl = document.getElementById('dist-num');
    hullFillEl = document.getElementById('hull-fill');
    hullPctEl = document.getElementById('hull-pct');
    itemBadgeEl = document.getElementById('active-item-badge');
    muteBtn = document.getElementById('mute-btn');

    // 5. Game Over Elements
    gameOverModal = document.getElementById('game-over-modal');
    goDistEl = document.getElementById('go-dist');
    goScoreEl = document.getElementById('go-score');
    goBestDistEl = document.getElementById('go-best-dist');
    goBestScoreEl = document.getElementById('go-best-score');
    retryBtn = document.getElementById('retry-btn');
    goLobbyBtn = document.getElementById('go-lobby-btn');

    // 6. Result Modal Elements
    resultModal = document.getElementById('result-modal');
    resultTitle = document.getElementById('result-title');
    resultLevelName = document.getElementById('result-level-name');
    resultTime = document.getElementById('result-time');
    resultPar = document.getElementById('result-par');
    resultGas = document.getElementById('result-gas');
    resultHull = document.getElementById('result-hull');
    resultRetryBtn = document.getElementById('result-retry-btn');
    resultNextBtn = document.getElementById('result-next-btn');
    resultLobbyBtn = document.getElementById('result-lobby-btn');
    resultShareBtn = document.getElementById('result-share-btn');
    shareToast = document.getElementById('share-toast');

    // 7. Top Right Controls
    gfxBtn = document.getElementById('gfx-btn');
    recenterBtn = document.getElementById('recenter-btn');
    conceptBtn = document.getElementById('concept-cam-btn');
    conceptBanner = document.getElementById('concept-banner');
    conceptTitle = document.getElementById('concept-title');
    conceptDesc = document.getElementById('concept-desc');
    autopilotBtn = document.getElementById('autopilot-btn');
    autopilotBanner = document.getElementById('autopilot-banner');
    autoDemoBtn = document.getElementById('auto-demo-btn');

    // ------------------------------------------------------------------------
    // EVENT BINDINGS
    // ------------------------------------------------------------------------

    // Autopilot Toggle Button
    if (autopilotBtn) {
      autopilotBtn.addEventListener('click', toggleAutopilot);
    }

    // AI Autopilot Demo Run (Lobby Button)
    if (autoDemoBtn) {
      autoDemoBtn.addEventListener('click', () => {
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        if (window.AutopilotAI) window.AutopilotAI.setEnabled(true);
        updateAutopilotUI();
        hideLevelSelect();
        hideGarage();
        window.GameState.set(window.GameState.STATES.PLAYING_DASH);
      });
    }

    // Play Dash Mode
    if (playDashBtn) {
      playDashBtn.addEventListener('click', () => {
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        hideLevelSelect();
        hideGarage();
        window.GameState.set(window.GameState.STATES.PLAYING_DASH);
      });
    }

    // Parking Mode -> Opens Not Ready Modal
    if (parkingModeBtn) {
      parkingModeBtn.addEventListener('click', () => {
        showParkingDevModal();
      });
    }

    if (parkingDevCloseBtn) {
      parkingDevCloseBtn.addEventListener('click', hideParkingDevModal);
    }

    if (parkingDevPlayBtn) {
      parkingDevPlayBtn.addEventListener('click', () => {
        hideParkingDevModal();
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        window.GameState.set(window.GameState.STATES.PLAYING_DASH);
      });
    }

    // Garage
    if (garageBtn) {
      garageBtn.addEventListener('click', () => {
        showGarage();
      });
    }

    // Level Select Modal Controls
    if (levelSelectCloseBtn) {
      levelSelectCloseBtn.addEventListener('click', () => {
        hideLevelSelect();
      });
    }

    // Garage Modal Controls
    if (garagePrevBtn) {
      garagePrevBtn.addEventListener('click', () => {
        changePreviewCar(-1);
      });
    }
    if (garageNextBtn) {
      garageNextBtn.addEventListener('click', () => {
        changePreviewCar(1);
      });
    }
    if (garageSelectBtn) {
      garageSelectBtn.addEventListener('click', () => {
        selectPreviewCar();
      });
    }
    if (garageCloseBtn) {
      garageCloseBtn.addEventListener('click', () => {
        hideGarage();
      });
    }

    // Secondary Buttons
    if (leaderboardBtn) {
      leaderboardBtn.addEventListener('click', () => {
        showLeaderboardAlert();
      });
    }
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        const next = qualityTier === 'HIGH' ? 'ULTRA' : (qualityTier === 'ULTRA' ? 'MOBILE' : 'HIGH');
        setQuality(next, onQualityChange);
      });
    }
    if (aboutBtn) {
      aboutBtn.addEventListener('click', () => {
        alert('Aero Roadster: Coastal Sunset 3D\n\nPrecision thruster flight and high-speed highway action.\nIndependent fan project. Not affiliated with Tesla, Inc.');
      });
    }

    // Pause Controls
    if (pauseBtn) {
      pauseBtn.addEventListener('click', togglePause);
    }
    if (pauseResumeBtn) {
      pauseResumeBtn.addEventListener('click', resumeGame);
    }
    if (pauseRestartBtn) {
      pauseRestartBtn.addEventListener('click', () => {
        hidePause();
        if (window.GameState.getPrevious() === window.GameState.STATES.PLAYING_PARKING) {
          if (cbRetryParking) cbRetryParking();
        } else {
          if (cbRestartDash) cbRestartDash();
        }
      });
    }

    // Pause Quick Settings (Accessible via Pause Modal on Mobile & Desktop)
    if (pauseMuteBtn) {
      pauseMuteBtn.addEventListener('click', () => {
        window.SoundFX.toggleMute();
        updateMuteBtn();
        updatePauseSettingsUI();
      });
    }
    if (pauseGfxBtn) {
      pauseGfxBtn.addEventListener('click', () => {
        const next = qualityTier === 'HIGH' ? 'ULTRA' : (qualityTier === 'ULTRA' ? 'MOBILE' : 'HIGH');
        setQuality(next, onQualityChange);
        updatePauseSettingsUI();
      });
    }
    if (pauseAutopilotBtn) {
      pauseAutopilotBtn.addEventListener('click', () => {
        toggleAutopilot();
        updatePauseSettingsUI();
      });
    }
    if (pauseRecenterBtn) {
      pauseRecenterBtn.addEventListener('click', () => {
        if (onRecenter) onRecenter();
        resumeGame();
      });
    }
    if (pauseConceptBtn) {
      pauseConceptBtn.addEventListener('click', () => {
        cycleConceptMode();
        updatePauseSettingsUI();
      });
    }
    if (pauseFsBtn) {
      pauseFsBtn.addEventListener('click', () => {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      });
    }
    if (pauseQuitBtn) {
      pauseQuitBtn.addEventListener('click', () => {
        hidePause();
        window.GameState.set(window.GameState.STATES.LOBBY);
      });
    }
    if (goLobbyBtn) {
      goLobbyBtn.addEventListener('click', () => {
        hideGameOver();
        window.GameState.set(window.GameState.STATES.LOBBY);
      });
    }

    // Result Screen Buttons
    if (resultRetryBtn) {
      resultRetryBtn.addEventListener('click', () => {
        hideResult();
        if (cbRetryParking) cbRetryParking();
      });
    }
    if (resultNextBtn) {
      resultNextBtn.addEventListener('click', () => {
        hideResult();
        if (cbNextLevelParking) cbNextLevelParking();
      });
    }
    if (resultLobbyBtn) {
      resultLobbyBtn.addEventListener('click', () => {
        hideResult();
        window.GameState.set(window.GameState.STATES.LOBBY);
      });
    }
    if (resultShareBtn) {
      resultShareBtn.addEventListener('click', shareRecord);
    }

    // Keyboard 'Escape' or 'KeyP' for Pause
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (window.GameState.isPlaying() || window.GameState.isPaused()) {
          togglePause();
        }
      }
    });

    // Mute Toggle Button
    if (muteBtn) {
      updateMuteBtn();
      muteBtn.addEventListener('click', () => {
        window.SoundFX.toggleMute();
        updateMuteBtn();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') {
        window.SoundFX.toggleMute();
        updateMuteBtn();
      }
      if (e.code === 'KeyU' || e.code === 'KeyJ') {
        toggleAutopilot();
      }
    });

    // Graphics Tier Button
    if (gfxBtn) {
      gfxBtn.addEventListener('click', () => {
        const next = qualityTier === 'HIGH' ? 'ULTRA' : (qualityTier === 'ULTRA' ? 'MOBILE' : 'HIGH');
        setQuality(next, onQualityChange);
      });
      setQuality(qualityTier, onQualityChange);
    }

    // Recenter Car
    if (recenterBtn && onRecenter) {
      recenterBtn.addEventListener('click', onRecenter);
    }

    // Retry Button in Game Over
    if (retryBtn && onRestartDash) {
      retryBtn.addEventListener('click', onRestartDash);
    }

    // Concept Camera Mode Switcher
    if (conceptBtn) {
      conceptBtn.addEventListener('click', cycleConceptMode);
    }

    // Listen to GameState transitions to update DOM visibility
    window.GameState.onChange(handleStateChange);

    updateScoreDisplay();
  }

  function handleStateChange(toState, fromState) {
    if (toState === window.GameState.STATES.LOBBY) {
      showLobbyScreen();
    } else if (toState === window.GameState.STATES.PLAYING_DASH) {
      hideLevelSelect();
      hideGarage();
      showGameplayHUD(false);
    } else if (toState === window.GameState.STATES.PLAYING_PARKING) {
      hideLevelSelect();
      hideGarage();
      showGameplayHUD(true);
    } else if (toState === window.GameState.STATES.PAUSED) {
      showPause();
    } else if (toState === window.GameState.STATES.GARAGE) {
      showGarage();
    }
  }

  function showLobbyScreen() {
    if (lobbyScreen) lobbyScreen.style.display = 'flex';
    if (hudEl) hudEl.style.display = 'none';
    if (touchControlsEl) touchControlsEl.style.display = 'none';
    if (pauseModal) pauseModal.style.display = 'none';
    if (gameOverModal) gameOverModal.style.display = 'none';
    if (resultModal) resultModal.style.display = 'none';
    hideLevelSelect();
    hideGarage();
  }

  function showGameplayHUD(isParking = false) {
    if (lobbyScreen) lobbyScreen.style.display = 'none';
    if (hudEl) hudEl.style.display = 'block';
    if (touchControlsEl) {
      touchControlsEl.style.display = isMobileDevice ? 'block' : 'none';
    }
    if (pauseModal) pauseModal.style.display = 'none';
    if (gameOverModal) gameOverModal.style.display = 'none';
    if (resultModal) resultModal.style.display = 'none';
    hideLevelSelect();
    hideGarage();

    if (parkingHudPill) {
      parkingHudPill.style.display = isParking ? 'flex' : 'none';
    }

    // Adjust top HUD labels for parking vs dash
    const topScorePanel = document.getElementById('top-score-panel');
    if (topScorePanel) {
      topScorePanel.style.display = isParking ? 'none' : 'block';
    }

    updateAutopilotUI();
  }

  function toggleAutopilot() {
    if (window.AutopilotAI) {
      window.AutopilotAI.toggle();
      updateAutopilotUI();
      showToast(window.AutopilotAI.isEnabled() ? '🤖 Autopilot: ON' : '🤖 Autopilot: OFF');
    }
  }

  function updateAutopilotUI() {
    const isAuto = window.AutopilotAI ? window.AutopilotAI.isEnabled() : false;
    if (autopilotBtn) {
      autopilotBtn.textContent = isAuto ? '🤖 Auto: ON' : '🤖 Auto: OFF';
      if (isAuto) autopilotBtn.classList.add('active');
      else autopilotBtn.classList.remove('active');
    }
    if (autopilotBanner) {
      autopilotBanner.style.display = isAuto ? 'block' : 'none';
    }
  }

  // --------------------------------------------------------------------------
  // LEVEL SELECTOR MODAL
  // --------------------------------------------------------------------------
  function showLevelSelect() {
    if (!levelSelectModal) return;
    renderLevelGrid();
    levelSelectModal.style.display = 'flex';
  }

  function hideLevelSelect() {
    if (levelSelectModal) levelSelectModal.style.display = 'none';
  }

  function renderLevelGrid() {
    if (!levelGridEl) return;
    levelGridEl.innerHTML = '';
    const levels = window.LevelManager ? window.LevelManager.LEVELS : [];
    levels.forEach((lvl, idx) => {
      const stars = window.GameStorage ? window.GameStorage.getStars(lvl.id) : 0;
      let starStr = '';
      for (let s = 1; s <= 3; s++) {
        starStr += s <= stars ? '★' : '☆';
      }

      const card = document.createElement('div');
      card.className = 'level-card-btn';
      card.innerHTML = `
        <div class="lvl-num">LVL ${lvl.id}</div>
        <div class="lvl-name">${lvl.name}</div>
        <div class="lvl-stars">${starStr}</div>
      `;
      card.addEventListener('click', () => {
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        hideLevelSelect();
        if (cbStartParkingLevel) {
          cbStartParkingLevel(idx);
        } else {
          window.GameState.set(window.GameState.STATES.PLAYING_PARKING);
        }
      });
      levelGridEl.appendChild(card);
    });
  }

  // --------------------------------------------------------------------------
  // GARAGE CAROUSEL & CAR SELECTION
  // --------------------------------------------------------------------------
  function showGarage() {
    if (!garageModal) return;
    if (window.CarsManager) {
      previewCarIndex = window.CarsManager.getCurrentIndex();
    }
    updateGarageUI();
    garageModal.style.display = 'flex';
  }

  function hideGarage() {
    if (garageModal) garageModal.style.display = 'none';
    if (window.CarsManager) {
      window.CarsManager.applyCar(window.CarsManager.getCurrentCar());
    }
  }

  function changePreviewCar(dir) {
    if (!window.CarsManager) return;
    const cars = window.CarsManager.getCARS();
    previewCarIndex = (previewCarIndex + dir + cars.length) % cars.length;
    updateGarageUI();
    window.CarsManager.applyCar(cars[previewCarIndex]);
  }

  function selectPreviewCar() {
    if (!window.CarsManager) return;
    const cars = window.CarsManager.getCARS();
    const car = cars[previewCarIndex];
    if (window.CarsManager.isCarUnlocked(car)) {
      window.CarsManager.selectCar(previewCarIndex);
      updateGarageUI();
      showToast(`${car.name} Selected!`);
    }
  }

  function updateGarageUI() {
    if (!window.CarsManager) return;
    const cars = window.CarsManager.getCARS();
    const car = cars[previewCarIndex];
    const isUnlocked = window.CarsManager.isCarUnlocked(car);
    const isSelected = window.CarsManager.getCurrentIndex() === previewCarIndex;
    const totalStars = window.GameStorage ? window.GameStorage.getTotalStars() : 0;

    if (garageCarName) garageCarName.textContent = car.name;
    if (garageCarDesc) garageCarDesc.textContent = car.desc;

    if (garageStatThruster) {
      const pct = Math.min(100, Math.round((car.thrusterPower / 16.0) * 100));
      garageStatThruster.style.width = `${pct}%`;
    }
    if (garageStatDurability) {
      const pct = Math.min(100, Math.round((car.durability / 170.0) * 100));
      garageStatDurability.style.width = `${pct}%`;
    }
    if (garageStatGas) {
      const pct = Math.min(100, Math.round((car.gasCapacity / 140.0) * 100));
      garageStatGas.style.width = `${pct}%`;
    }
    if (garageStatAgility) {
      const pct = Math.min(100, Math.round(((2.0 - car.mass) / 1.5) * 100));
      garageStatAgility.style.width = `${pct}%`;
    }

    if (garageSelectBtn) {
      if (!isUnlocked) {
        garageSelectBtn.textContent = `🔒 Locked (${car.unlockStars} ⭐ needed - You have ${totalStars})`;
        garageSelectBtn.disabled = true;
        garageSelectBtn.style.opacity = '0.6';
      } else if (isSelected) {
        garageSelectBtn.textContent = `✓ Active Vehicle`;
        garageSelectBtn.disabled = true;
        garageSelectBtn.style.opacity = '0.85';
      } else {
        garageSelectBtn.textContent = `Select Vehicle`;
        garageSelectBtn.disabled = false;
        garageSelectBtn.style.opacity = '1.0';
      }
    }
  }

  function showLeaderboardAlert() {
    const bestS = window.GameStorage ? window.GameStorage.getBestScore() : bestScore;
    const bestD = window.GameStorage ? window.GameStorage.getBestDistance() : bestDist;
    const totalS = window.GameStorage ? window.GameStorage.getTotalStars() : 0;
    alert(`🏆 AERO ROADSTER LOCAL RECORDS\n\nDash High Score: ${bestS.toLocaleString()} pts\nDash Best Distance: ${bestD.toLocaleString()} m\nParking Stars Earned: ${totalS} / 18 ⭐\n\nAll records saved in localStorage.`);
  }

  function togglePause() {
    if (window.GameState.isPaused()) {
      resumeGame();
    } else if (window.GameState.isPlaying()) {
      window.GameState.set(window.GameState.STATES.PAUSED);
    }
  }

  function resumeGame() {
    const prev = window.GameState.getPrevious();
    hidePause();
    if (prev === window.GameState.STATES.PLAYING_PARKING) {
      window.GameState.set(window.GameState.STATES.PLAYING_PARKING);
    } else {
      window.GameState.set(window.GameState.STATES.PLAYING_DASH);
    }
  }

  function cycleConceptMode() {
    conceptMode = (conceptMode + 1) % 4;
    if (conceptMode === 0) {
      if (conceptBtn) {
        conceptBtn.textContent = '📷 Concept Cam';
        conceptBtn.classList.remove('active');
      }
      if (conceptBanner) conceptBanner.style.display = 'none';
    } else {
      if (conceptBtn) {
        conceptBtn.textContent = `📷 Concept #${conceptMode}/3`;
        conceptBtn.classList.add('active');
      }
      if (conceptBanner) {
        conceptBanner.style.display = 'block';
        conceptTitle.textContent = config.conceptPresets[conceptMode].title;
        conceptDesc.textContent = config.conceptPresets[conceptMode].desc;
      }
    }
  }

  function updatePauseSettingsUI() {
    if (pauseMuteBtn) {
      pauseMuteBtn.textContent = window.SoundFX && window.SoundFX.isMuted() ? '🔇 Audio: OFF' : '🔊 Audio: ON';
    }
    if (pauseGfxBtn) {
      pauseGfxBtn.textContent = `✨ GFX: ${qualityTier}`;
    }
    if (pauseAutopilotBtn) {
      const isAuto = window.AutopilotAI ? window.AutopilotAI.isEnabled() : false;
      pauseAutopilotBtn.textContent = isAuto ? '🤖 AI Auto: ON' : '🤖 AI Auto: OFF';
      if (isAuto) pauseAutopilotBtn.classList.add('active');
      else pauseAutopilotBtn.classList.remove('active');
    }
    if (pauseConceptBtn) {
      pauseConceptBtn.textContent = conceptMode === 0 ? '📷 Concept Cam' : `📷 Concept #${conceptMode}/3`;
      if (conceptMode > 0) pauseConceptBtn.classList.add('active');
      else pauseConceptBtn.classList.remove('active');
    }
  }

  function showParkingDevModal() {
    if (parkingDevModal) parkingDevModal.style.display = 'flex';
  }

  function hideParkingDevModal() {
    if (parkingDevModal) parkingDevModal.style.display = 'none';
  }

  function showPause() {
    updatePauseSettingsUI();
    if (pauseModal) pauseModal.style.display = 'flex';
  }

  function hidePause() {
    if (pauseModal) pauseModal.style.display = 'none';
  }

  function showResult(data) {
    lastResultData = data;
    if (window.GameStorage && data.levelId && data.stars) {
      window.GameStorage.setStars(data.levelId, data.stars);
    }

    if (resultModal) {
      resultModal.style.display = 'flex';
      if (resultLevelName) resultLevelName.textContent = data.levelName;
      if (resultTime) resultTime.textContent = `${data.time.toFixed(1)}s`;
      if (resultPar) resultPar.textContent = `${data.parTime}s`;
      if (resultGas) resultGas.textContent = `${Math.round(data.gas)}%`;
      if (resultHull) resultHull.textContent = `${Math.round(data.health)}%`;

      if (resultTitle) {
        resultTitle.textContent = data.stars === 3 ? '🌟 PERFECT PARK!' : 'PARKED!';
      }

      // Render 1 to 3 earned stars
      for (let s = 1; s <= 3; s++) {
        const starEl = document.getElementById(`star-${s}`);
        if (starEl) {
          if (s <= data.stars) {
            starEl.classList.add('earned');
          } else {
            starEl.classList.remove('earned');
          }
        }
      }
    }
  }

  function hideResult() {
    if (resultModal) resultModal.style.display = 'none';
  }

  function updateParkingHUD(parkProgress, isInside) {
    if (!parkingHudPill) return;
    if (parkProgress >= 1.0) {
      parkingHudPill.className = 'parked';
      parkingHudPill.textContent = '✅ PARKED!';
    } else if (parkProgress > 0) {
      parkingHudPill.className = 'aligning';
      parkingHudPill.textContent = `HOLD POSITION: ${Math.round(parkProgress * 100)}%`;
    } else if (isInside) {
      parkingHudPill.className = 'aligning';
      parkingHudPill.textContent = 'ALIGN & LEVEL CAR';
    } else {
      parkingHudPill.className = '';
      parkingHudPill.textContent = '🎯 FLY TO GLOWING BAY';
    }
  }

  function shareRecord() {
    if (!lastResultData) return;
    const starStr = '⭐'.repeat(lastResultData.stars);
    const text = `Aero Roadster: Thruster Parking\n${lastResultData.levelName}\nRating: ${starStr} (${lastResultData.stars}/3 Stars)\nTime: ${lastResultData.time.toFixed(1)}s | Gas: ${Math.round(lastResultData.gas)}%\nPlay free: ${window.location.href}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Record copied to clipboard!');
      }).catch(() => {
        showToast('Shared!');
      });
    } else {
      showToast('Shared!');
    }
  }

  function showToast(msg) {
    if (shareToast) {
      shareToast.textContent = msg;
      shareToast.classList.add('show');
      setTimeout(() => {
        shareToast.classList.remove('show');
      }, 2200);
    }
  }

  function updateMuteBtn() {
    if (!muteBtn) return;
    const isMuted = window.SoundFX.isMuted();
    muteBtn.textContent = isMuted ? '🔇 Audio: OFF' : '🔊 Audio: ON';
  }

  function setQuality(tier, callback) {
    qualityTier = tier;
    if (gfxBtn) gfxBtn.textContent = `✨ GFX: ${tier}`;
    if (callback) callback(tier);
  }

  function addStunt(stuntKey, customPts, customFuel, isFever = false) {
    let name, pts, fuelBonus;
    if (config.stunts[stuntKey]) {
      const s = config.stunts[stuntKey];
      name = s.name;
      pts = s.points;
      fuelBonus = s.fuelBonus;
    } else {
      name = stuntKey;
      pts = customPts || 100;
      fuelBonus = customFuel || 15;
    }

    streak = Math.min(99, streak + 1);
    streakTimer = 1.0;

    const multiplier = Math.max(1, Math.floor(streak / 3)) * (isFever ? 2 : 1);
    const gained = pts * multiplier;
    pendingScore += gained;

    window.SoundFX.playStuntChime();

    if (stuntFeedEl) {
      const item = document.createElement('div');
      item.className = 'stunt-popup';
      item.innerHTML = `${name} <span>+${gained}</span>`;
      stuntFeedEl.prepend(item);
      while (stuntFeedEl.children.length > 3) stuntFeedEl.lastChild.remove();
      setTimeout(() => item.remove(), 1800);
    }

    updateScoreDisplay();
    return fuelBonus;
  }

  function bankPendingScore() {
    if (pendingScore > 0) {
      totalScore += pendingScore;
      pendingScore = 0;
      updateScoreDisplay();
    }
  }

  function updateScoreDisplay() {
    if (scoreEl) scoreEl.textContent = totalScore.toLocaleString();
    if (streakMultEl) streakMultEl.textContent = `x${streak}`;
    if (streakCountEl) streakCountEl.textContent = streak;
    if (pendingEl) pendingEl.textContent = pendingScore > 0 ? `+${pendingScore.toLocaleString()}` : '';
  }

  function updateHUD(speed, fuel, health, distance, airborne, usingBoost, activeItem, itemTimer, dt) {
    streakTimer -= dt * 0.14;
    if (streakTimer <= 0) {
      bankPendingScore();
      streak = Math.max(1, streak - 1);
      streakTimer = 1.0;
      updateScoreDisplay();
    }

    if (streakFillEl) {
      streakFillEl.style.width = `${Math.max(5, streakTimer * 100)}%`;
    }

    distanceMeters = Math.floor(distance * 0.45);
    if (distEl) distEl.textContent = distanceMeters.toLocaleString();

    if (speedNumEl) speedNumEl.textContent = Math.round(speed * 1.35);

    if (aeroStatusEl) {
      aeroStatusEl.textContent = airborne
        ? 'COLD-GAS FLIGHT ACTIVE'
        : (usingBoost ? 'ACTIVE AERO: CRYO BOOST' : 'LANE ASSIST: LOCKED');
    }

    if (airBarInner) airBarInner.style.width = `${fuel}%`;
    if (fuelPctEl) fuelPctEl.textContent = `${Math.round(fuel)}%`;

    if (hullFillEl) {
      hullFillEl.style.width = `${Math.max(0, health)}%`;
      if (health > 50) {
        hullFillEl.style.background = 'linear-gradient(90deg, #66bb6a, #43a047)';
      } else if (health > 25) {
        hullFillEl.style.background = 'linear-gradient(90deg, #ffa726, #fb8c00)';
      } else {
        hullFillEl.style.background = 'linear-gradient(90deg, #ef5350, #e53935)';
      }
    }
    if (hullPctEl) hullPctEl.textContent = `${Math.round(health)}%`;

    if (itemBadgeEl) {
      if (activeItem && itemTimer > 0) {
        itemBadgeEl.style.display = 'flex';
        itemBadgeEl.innerHTML = `${activeItem.icon} <strong>${activeItem.name}</strong> <span>${itemTimer.toFixed(1)}s</span>`;
      } else {
        itemBadgeEl.style.display = 'none';
      }
    }

    if (fxOverlay) fxOverlay.style.opacity = usingBoost ? '0.22' : '0.06';
  }

  function showGameOver() {
    bankPendingScore();
    if (window.GameStorage) {
      window.GameStorage.setBestScore(totalScore);
      window.GameStorage.setBestDistance(distanceMeters);
      bestScore = window.GameStorage.getBestScore();
      bestDist = window.GameStorage.getBestDistance();
    } else {
      if (totalScore > bestScore) {
        bestScore = totalScore;
        localStorage.setItem('tessa_best_score', bestScore);
      }
      if (distanceMeters > bestDist) {
        bestDist = distanceMeters;
        localStorage.setItem('tessa_best_dist', bestDist);
      }
    }

    if (goDistEl) goDistEl.textContent = `${distanceMeters.toLocaleString()} m`;
    if (goScoreEl) goScoreEl.textContent = totalScore.toLocaleString();
    if (goBestDistEl) goBestDistEl.textContent = `${bestDist.toLocaleString()} m`;
    if (goBestScoreEl) goBestScoreEl.textContent = bestScore.toLocaleString();

    if (gameOverModal) gameOverModal.style.display = 'flex';
  }

  function hideGameOver() {
    if (gameOverModal) gameOverModal.style.display = 'none';
    totalScore = 0;
    pendingScore = 0;
    streak = 1;
    streakTimer = 1.0;
    updateScoreDisplay();
  }

  return {
    init,
    addStunt,
    bankPendingScore,
    updateHUD,
    showGameOver,
    hideGameOver,
    showResult,
    hideResult,
    updateParkingHUD,
    togglePause,
    showLobby: showLobbyScreen,
    getConceptMode: () => conceptMode,
    getQualityTier: () => qualityTier
  };
})();
