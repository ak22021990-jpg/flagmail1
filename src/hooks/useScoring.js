import { useState, useCallback } from 'react';
import { MAX_SCORE } from '../styles/tokens.js';

export function useScoring() {
  const [totalScore, setTotalScore] = useState(0);
  const [perEmail, setPerEmail] = useState([]);
  const [zoneScores, setZoneScores] = useState({ 1: 0, 2: 0, 3: 0 });
  const [categoryCorrect, setCategoryCorrect] = useState({
    'Legitimate': { correct: 0, total: 0 },
    'Phishing & Spoofing': { correct: 0, total: 0 },
    'Spam & Junk': { correct: 0, total: 0 },
    'Malicious Content': { correct: 0, total: 0 },
    'Abuse & Harassment': { correct: 0, total: 0 },
    'High-Risk Fraud': { correct: 0, total: 0 },
  });

  const scoreRound = useCallback(({
    email,
    selectedL1,
    selectedL2,
    cluesRevealed,
    timedOut,
  }) => {
    const l1Correct = selectedL1 === email.level1;
    const l2Correct = selectedL2 === email.level2;
    const clueCount = cluesRevealed.length;

    let points = 0;
    let l1Points = 0;
    let l2Points = 0;
    let clueDeduction = 0;

    if (l1Correct) {
      l1Points = 2;
      if (!timedOut && l2Correct) {
        l2Points = 2;
      }
      clueDeduction = Math.min(clueCount, l1Points + l2Points);
      points = Math.max(0, l1Points + l2Points - clueDeduction);
    }

    const record = {
      emailId: email.id,
      zone: email.zone,
      selectedL1,
      selectedL2,
      correctL1: email.level1,
      correctL2: email.level2,
      l1Correct,
      l2Correct: l1Correct && !timedOut && l2Correct,
      cluesUsed: clueCount,
      timedOut,
      points,
      l1Points,
      l2Points,
      clueDeduction,
    };

    setPerEmail(prev => [...prev, record]);
    setTotalScore(prev => prev + points);
    setZoneScores(prev => ({
      ...prev,
      [email.zone]: (prev[email.zone] || 0) + points,
    }));
    setCategoryCorrect(prev => {
      const cat = email.level1;
      return {
        ...prev,
        [cat]: {
          correct: prev[cat].correct + (l1Correct ? 1 : 0),
          total: prev[cat].total + 1,
        },
      };
    });

    return record;
  }, []);

  const resetScoring = useCallback(() => {
    setTotalScore(0);
    setPerEmail([]);
    setZoneScores({ 1: 0, 2: 0, 3: 0 });
    setCategoryCorrect({
      'Legitimate': { correct: 0, total: 0 },
      'Phishing & Spoofing': { correct: 0, total: 0 },
      'Spam & Junk': { correct: 0, total: 0 },
      'Malicious Content': { correct: 0, total: 0 },
      'Abuse & Harassment': { correct: 0, total: 0 },
      'High-Risk Fraud': { correct: 0, total: 0 },
    });
  }, []);

  const displayScore = Math.round((totalScore / MAX_SCORE) * 100);

  return { totalScore, displayScore, perEmail, zoneScores, categoryCorrect, scoreRound, resetScoring };
}
