/**
 * ============================================================================
 * LOCAL STORAGE & PERSISTENCE MANAGER
 * ============================================================================
 * Manages saving and loading stars per level, high scores, selected cars,
 * and audio/settings. Modularly isolated for easy swapping to Supabase later.
 */

window.GameStorage = (function () {
  const PREFIX = 'aero_roadster_';

  function getStars(levelId) {
    try {
      return parseInt(localStorage.getItem(`${PREFIX}stars_${levelId}`) || '0', 10);
    } catch (e) {
      return 0;
    }
  }

  function setStars(levelId, stars) {
    try {
      const current = getStars(levelId);
      if (stars > current) {
        localStorage.setItem(`${PREFIX}stars_${levelId}`, stars);
      }
    } catch (e) {}
  }

  function getTotalStars() {
    let total = 0;
    for (let i = 1; i <= 6; i++) {
      total += getStars(i);
    }
    return total;
  }

  function getBestScore() {
    try {
      return parseInt(localStorage.getItem(`${PREFIX}best_score`) || '0', 10);
    } catch (e) {
      return 0;
    }
  }

  function setBestScore(score) {
    try {
      const current = getBestScore();
      if (score > current) {
        localStorage.setItem(`${PREFIX}best_score`, score);
      }
    } catch (e) {}
  }

  function getBestDistance() {
    try {
      return parseInt(localStorage.getItem(`${PREFIX}best_dist`) || '0', 10);
    } catch (e) {
      return 0;
    }
  }

  function setBestDistance(dist) {
    try {
      const current = getBestDistance();
      if (dist > current) {
        localStorage.setItem(`${PREFIX}best_dist`, dist);
      }
    } catch (e) {}
  }

  function getSelectedCarId() {
    try {
      return localStorage.getItem(`${PREFIX}selected_car`) || 'dash';
    } catch (e) {
      return 'dash';
    }
  }

  function setSelectedCarId(id) {
    try {
      localStorage.setItem(`${PREFIX}selected_car`, id);
    } catch (e) {}
  }

  return {
    getStars,
    setStars,
    getTotalStars,
    getBestScore,
    setBestScore,
    getBestDistance,
    setBestDistance,
    getSelectedCarId,
    setSelectedCarId
  };
})();
