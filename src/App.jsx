import { useCallback } from 'react';
import './styles/animations.css';

import { useGameState, SCREENS } from './hooks/useGameState.js';
import { useScoring } from './hooks/useScoring.js';
import LandingScreen    from './components/LandingScreen.jsx';
import TutorialScreen   from './components/TutorialScreen.jsx';
import ZoneIntroCard    from './components/ZoneIntroCard.jsx';
import GameRound        from './components/GameRound.jsx';
import ExplanationCard  from './components/ExplanationCard.jsx';
import ZoneComplete     from './components/ZoneComplete.jsx';
import ResultsScreen    from './components/ResultsScreen.jsx';

const BG = 'linear-gradient(180deg, #f5f7fb 0%, #edf3fb 42%, #f7f4ef 100%)';

export default function App() {
  const gs = useGameState();
  const sc = useScoring();

  // ── Submit a round ───────────────────────────────────────────────────────
  // timedOut=true is passed by GameRound when the timer fires (auto-submit)
  const handleSubmit = useCallback((timeLeft, timedOut = false) => {
    const { currentEmail, round } = gs;
    const record = sc.scoreRound({
      email: currentEmail,
      selectedL1: round.selectedL1,
      selectedL2: timedOut ? null : round.selectedL2,
      cluesRevealed: round.cluesRevealed,
      timedOut,
    });
    gs.submitRound(record);
  }, [gs, sc]);

  // ── Move to next email ───────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    gs.nextEmail();
  }, [gs]);

  // ── Advance zone / end game ──────────────────────────────────────────────
  const handleAdvanceZone = useCallback(() => {
    if (gs.zone === 3) {
      gs.submitToSheet({
        name: gs.player.name,
        email: gs.player.email,
        score: sc.totalScore,
        displayScore: sc.displayScore,
        title: sc.displayScore >= 80 ? 'Advanced' : sc.displayScore >= 50 ? 'Proficient' : 'Foundation',
        badges: 0,
        zone1Score: sc.zoneScores[1],
        zone2Score: sc.zoneScores[2],
        zone3Score: sc.zoneScores[3],
        perEmail: sc.perEmail,
      });
      gs.goToResults();
    } else {
      gs.advanceZone();
    }
  }, [gs, sc]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      background: BG,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      color: '#1C1C1E',
      position: 'relative',
    }}>
      {gs.screen === SCREENS.LANDING && (
        <LandingScreen onStart={gs.startGame} />
      )}

      {gs.screen === SCREENS.TUTORIAL && (
        <TutorialScreen onSkip={gs.completeTutorial} />
      )}

      {gs.screen === SCREENS.ZONE_INTRO && (
        <ZoneIntroCard
          zone={gs.zone}
          onStart={gs.startZone}
          earlyUnlocked={gs.earlyUnlocked}
        />
      )}

      {gs.screen === SCREENS.ROUND && gs.currentEmail && (
        <GameRound
          email={gs.currentEmail}
          zone={gs.zone}
          emailInZone={gs.emailInZone}
          emailsInZone={gs.emailsInZone}
          totalScore={sc.totalScore}
          round={gs.round}
          onRevealClue={gs.revealClue}
          onSelectL1={gs.selectL1}
          onSelectL2={gs.selectL2}
          onSubmit={handleSubmit}
        />
      )}

      {gs.screen === SCREENS.EXPLANATION && gs.currentEmail && gs.round.lastRecord && (
        <ExplanationCard
          email={gs.currentEmail}
          record={gs.round.lastRecord}
          totalScore={sc.totalScore}
          onNext={handleNext}
        />
      )}

      {gs.screen === SCREENS.ZONE_COMPLETE && (
        <ZoneComplete
          zone={gs.zone}
          zoneScore={sc.zoneScores[gs.zone]}
          maxZoneScore={gs.emailsInZone * 4}
          zoneEmails={sc.perEmail.filter(r => r.zone === gs.zone)}
          earlyUnlocked={gs.earlyUnlocked}
          consecutivePerfect={gs.consecutivePerfect}
          onContinue={handleAdvanceZone}
        />
      )}

      {gs.screen === SCREENS.RESULTS && (
        <ResultsScreen
          player={gs.player}
          finalScore={sc.totalScore}
          displayScore={sc.displayScore}
          zoneScores={sc.zoneScores}
          categoryCorrect={sc.categoryCorrect}
          perEmail={sc.perEmail}
        />
      )}
    </div>
  );
}
