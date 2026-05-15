import { useState, useCallback } from 'react';
import { shuffleEmails } from '../utils/shuffle.js';
import { LEADERBOARD_URL } from '../config.js';

export const SCREENS = {
  LANDING:       'landing',
  TUTORIAL:      'tutorial',
  ZONE_INTRO:    'zone_intro',
  ROUND:         'round',
  EXPLANATION:   'explanation',
  ZONE_COMPLETE: 'zone_complete',
  RESULTS:       'results',
};

const ZONE_EMAIL_COUNTS = { 1: 5, 2: 5, 3: 5 };

function initialRoundState() {
  return {
    cluesRevealed: [],
    selectedL1: null,
    selectedL2: null,
    submitted: false,
    timedOut: false,
    lastRecord: null,
  };
}

export function useGameState() {
  const [screen, setScreen] = useState(SCREENS.LANDING);
  const [player, setPlayer] = useState({ name: '', email: '' });
  const [emailPool, setEmailPool] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zone, setZone] = useState(1);
  const [consecutivePerfect, setConsecutivePerfect] = useState(0);
  const [earlyUnlocked, setEarlyUnlocked] = useState(false);
  const [tutorialSeen, setTutorialSeen] = useState(false);
  const [round, setRound] = useState(initialRoundState());

  // Computed helpers
  const currentEmail = emailPool[currentIndex] || null;

  const zoneStart = zone === 1 ? 0 : zone === 2 ? 5 : 10;
  const zoneEnd   = zone === 1 ? 5 : zone === 2 ? 10 : 15;
  const emailInZone = currentIndex - zoneStart + 1;
  const emailsInZone = ZONE_EMAIL_COUNTS[zone];

  // ── Actions ──────────────────────────────────────────────────────────────

  const startGame = useCallback((name, email) => {
    setPlayer({ name, email });
    const pool = shuffleEmails({ name, email });
    setEmailPool(pool);
    setCurrentIndex(0);
    setZone(1);
    setConsecutivePerfect(0);
    setEarlyUnlocked(false);
    setRound(initialRoundState());
    if (!tutorialSeen) {
      setScreen(SCREENS.TUTORIAL);
    } else {
      setScreen(SCREENS.ZONE_INTRO);
    }
  }, [tutorialSeen]);

  const completeTutorial = useCallback(() => {
    setTutorialSeen(true);
    setScreen(SCREENS.ZONE_INTRO);
  }, []);

  const startZone = useCallback(() => {
    setRound(initialRoundState());
    setScreen(SCREENS.ROUND);
  }, []);

  const revealClue = useCallback((index) => {
    setRound(prev => {
      if (prev.cluesRevealed.includes(index)) return prev;
      return { ...prev, cluesRevealed: [...prev.cluesRevealed, index] };
    });
  }, []);

  const selectL1 = useCallback((l1) => {
    setRound(prev => ({ ...prev, selectedL1: l1, selectedL2: null }));
  }, []);

  const selectL2 = useCallback((l2) => {
    setRound(prev => ({ ...prev, selectedL2: l2 }));
  }, []);

  const handleTimeout = useCallback(() => {
    setRound(prev => ({ ...prev, timedOut: true }));
  }, []);

  const submitRound = useCallback((record) => {
    setRound(prev => ({ ...prev, submitted: true, lastRecord: record }));
    // Check perfect round (4 pts = perfect)
    const perfect = record.points === 4;
    setConsecutivePerfect(cp => {
      const next = perfect ? cp + 1 : 0;
      if (next >= 3) setEarlyUnlocked(true);
      return next;
    });
    setScreen(SCREENS.EXPLANATION);
  }, []);

  const nextEmail = useCallback(() => {
    const nextIndex = currentIndex + 1;

    // Check if zone complete
    if (nextIndex >= zoneEnd) {
      setScreen(SCREENS.ZONE_COMPLETE);
      return;
    }

    setCurrentIndex(nextIndex);
    setRound(initialRoundState());
    setScreen(SCREENS.ROUND);
  }, [currentIndex, zoneEnd]);

  const advanceZone = useCallback(() => {
    const nextZone = zone + 1;
    if (nextZone > 3) {
      setScreen(SCREENS.RESULTS);
      return;
    }
    setZone(nextZone);
    setCurrentIndex(zoneStart + ZONE_EMAIL_COUNTS[zone]);
    setConsecutivePerfect(0);
    setEarlyUnlocked(false);
    setRound(initialRoundState());
    setScreen(SCREENS.ZONE_INTRO);
  }, [zone, zoneStart]);

  const goToResults = useCallback(() => {
    setScreen(SCREENS.RESULTS);
  }, []);

  const submitToSheet = useCallback(async (playerData) => {
    if (!LEADERBOARD_URL || LEADERBOARD_URL === 'YOUR_APPS_SCRIPT_URL') return;
    try {
      await fetch(LEADERBOARD_URL, {
        method: 'POST',
        body: JSON.stringify(playerData),
      });
    } catch (err) {
      console.warn('Score submit failed:', err);
    }
  }, []);

  return {
    screen,
    player,
    emailPool,
    currentIndex,
    currentEmail,
    zone,
    zoneStart,
    zoneEnd,
    emailInZone,
    emailsInZone,
    consecutivePerfect,
    earlyUnlocked,
    round,
    // actions
    startGame,
    completeTutorial,
    startZone,
    revealClue,
    selectL1,
    selectL2,
    handleTimeout,
    submitRound,
    nextEmail,
    advanceZone,
    goToResults,
    submitToSheet,
  };
}
