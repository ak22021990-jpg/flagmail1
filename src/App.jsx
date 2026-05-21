import { useCallback, useState } from 'react';
import './styles/animations.css';

import { useGameState, SCREENS } from './hooks/useGameState.js';
import { useScoring } from './hooks/useScoring.js';
import { useSocState } from './hooks/useSocState.js';
import { useBadges } from './hooks/useBadges.js';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import LandingScreen    from './components/LandingScreen.jsx';
import TutorialScreen   from './components/TutorialScreen.jsx';
import ZoneIntroCard    from './components/ZoneIntroCard.jsx';
import GameRound        from './components/GameRound.jsx';
import ExplanationCard  from './components/ExplanationCard.jsx';
import ZoneComplete     from './components/ZoneComplete.jsx';
import ResultsScreen    from './components/ResultsScreen.jsx';
import SocIntroCard     from './components/SocIntroCard.jsx';
import SocRound         from './components/SocRound.jsx';
import SocExplanationCard from './components/SocExplanationCard.jsx';
import ReviewerScreen   from './components/ReviewerScreen.jsx';

const BG = 'linear-gradient(180deg, #f5f7fb 0%, #edf3fb 42%, #f7f4ef 100%)';

export default function App() {
  const gs = useGameState();
  const sc = useScoring();
  const soc = useSocState(gs);
  const badges = useBadges();

  const [gameViolations, setGameViolations] = useState(0);
  const [socViolations, setSocViolations] = useState(0);

  const handleSocSubmit = useCallback(() => {
    soc.submitSocRound();
    gs.setScreen(SCREENS.SOC_EXPLANATION);
  }, [soc, gs]);

  const handleSocNext = useCallback(() => {
    const hasMore = soc.nextQuestion();
    if (hasMore) {
      gs.setScreen(SCREENS.SOC_ROUND);
    } else {
      soc.submitSocToSheets(socViolations);
      gs.setScreen(SCREENS.SOC_RESULTS);
    }
  }, [soc, gs, socViolations]);

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
        action: 'submit',
        name: gs.player.name,
        email: gs.player.email,
        score: sc.totalScore,
        displayScore: sc.displayScore,
        title: sc.displayScore >= 80 ? 'Advanced' : sc.displayScore >= 50 ? 'Proficient' : 'Foundation',
        zone1Score: sc.zoneScores[1],
        zone2Score: sc.zoneScores[2],
        zone3Score: sc.zoneScores[3],
        perEmail: sc.perEmail,
        proctoring_violations: gameViolations,
      });
    }
    gs.advanceZone();
  }, [gs, sc, gameViolations]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
    <div style={{
      minHeight: '100vh',
      background: BG,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      color: '#1C1C1E',
      position: 'relative',
    }}>
      {gs.screen === SCREENS.LANDING && (
        <div style={{ position: 'relative' }}>
          <LandingScreen onStart={(name, email) => {
            gs.submitToSheet({ action: 'register', name, email });
            badges.resetBadges();
            gs.startGame(name, email);
          }} />
          <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 100 }}>
            <button
              onClick={() => gs.setScreen(SCREENS.REVIEWER)}
              style={{
                padding: '10px 16px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                border: '1px solid rgba(13,26,51,0.10)',
                background: 'rgba(255,255,255,0.88)',
                color: 'rgba(17,24,39,0.50)',
                cursor: 'pointer', backdropFilter: 'blur(12px)',
              }}
            >
              Reviewer
            </button>
          </div>
        </div>
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
          onViolationChange={setGameViolations}
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

      {gs.screen === SCREENS.SOC_INTRO && (
        <SocIntroCard onStart={() => gs.setScreen(SCREENS.SOC_ROUND)} />
      )}

      {gs.screen === SCREENS.SOC_ROUND && soc.currentQuestion && !soc.currentAnswer.submitted && (
        <SocRound
          question={soc.currentQuestion}
          answer={soc.currentAnswer}
          progress={soc.progress}
          onSetPrimary={soc.setPrimary}
          onSetSecondary={soc.setSecondary}
          onSetSplText={soc.setSplText}
          onSetExplanation={soc.setExplanation}
          onSubmit={handleSocSubmit}
          onViolationChange={setSocViolations}
        />
      )}

      {gs.screen === SCREENS.SOC_EXPLANATION && soc.currentAnswer.submitted && soc.currentAnswer.result && (
        <SocExplanationCard
          result={soc.currentAnswer.result}
          question={soc.currentQuestion}
          hasMore={soc.hasMoreQuestions}
          onNext={handleSocNext}
        />
      )}

      {gs.screen === SCREENS.SOC_RESULTS && (
        <ResultsScreen
          player={gs.player}
          finalScore={sc.totalScore}
          displayScore={sc.displayScore}
          zoneScores={sc.zoneScores}
          categoryCorrect={sc.categoryCorrect}
          perEmail={sc.perEmail}
          socScore={soc.socTotal}
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

      {gs.screen === SCREENS.REVIEWER && (
        <ReviewerScreen onBack={() => gs.setScreen(SCREENS.LANDING)} />
      )}
    </div>
    </ErrorBoundary>
  );
}
