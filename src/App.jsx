import { useCallback, useState, lazy, Suspense } from 'react';
import { scaleSocScore } from './utils/scoreSoc.js';
import { SOC_QUESTIONS } from './data/socQuestions.js';
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
const AdminPanel = lazy(() => import('./components/AdminPanel.jsx'));

const BG = 'linear-gradient(180deg, #f5f7fb 0%, #edf3fb 42%, #f7f4ef 100%)';

export default function App() {
  const gs = useGameState();
  const sc = useScoring();
  const soc = useSocState(gs);
  const badges = useBadges();

  const [gameViolations, setGameViolations] = useState(0);
  const [socViolations, setSocViolations] = useState(0);
  const [socScaledResult, setSocScaledResult] = useState(null);

  const handleSocSubmit = useCallback(() => {
    soc.submitSocRound();
    gs.setScreen(SCREENS.SOC_EXPLANATION);
  }, [soc, gs]);

  const handleSocNext = useCallback(() => {
    const hasMore = soc.nextQuestion();
    if (hasMore) {
      gs.setScreen(SCREENS.SOC_ROUND);
    } else {
      const { socScaled, finalScore } = scaleSocScore(soc.socTotal, sc.totalScore);
      setSocScaledResult(socScaled);

      const tier = finalScore >= 80 ? 'Advanced' : finalScore >= 50 ? 'Proficient' : 'Foundation';

      const socAnswers = SOC_QUESTIONS
        .map((q, idx) => ({ q, a: soc.answers[idx] }))
        .filter(({ a }) => a && a.submitted === true)
        .map(({ q, a }) => ({
          questionId: q.id,
          selectedPrimary: a.primary,
          correctPrimary: q.classification ? q.classification.correct.primary : null,
          selectedSecondary: Array.isArray(a.secondary) ? a.secondary.join(', ') : (a.secondary || ''),
          correctSecondary: q.classification
            ? (Array.isArray(q.classification.correct.secondary)
                ? q.classification.correct.secondary.join(', ')
                : q.classification.correct.secondary)
            : null,
          splText: a.splText,
          score: a.result ? a.result.score.total : 0,
          grade: a.result ? a.result.score.grade : '',
        }));

      const consolidatedPayload = {
        name: gs.player.name,
        email: gs.player.email,
        zone1Score: sc.zoneScores[1] || 0,
        zone2Score: sc.zoneScores[2] || 0,
        zone3Score: sc.zoneScores[3] || 0,
        displayScore: sc.displayScore,
        categoryCorrect: sc.categoryCorrect,
        perEmail: sc.perEmail,
        socTotal: soc.socTotal,
        socScaled,
        finalScore,
        tier,
        proctoring_violations: gameViolations + socViolations,
        socAnswers,
      };

      soc.submitFinal(consolidatedPayload);
      gs.setScreen(SCREENS.SOC_RESULTS);
    }
  }, [soc, gs, sc, socViolations, gameViolations]);

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
        <LandingScreen
          onStart={(name, email) => {
            gs.submitToSheet({ action: 'register', name, email });
            badges.resetBadges();
            gs.startGame(name, email);
          }}
          onReviewer={() => gs.setScreen(SCREENS.ADMIN)}
        />
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
           hintIndex={soc.hintIndex}
           onRevealHint={soc.revealHint}
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
          socScaled={socScaledResult}
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

      {gs.screen === SCREENS.ADMIN && (
        <Suspense fallback={<div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif', fontSize: 15, color: 'rgba(17,24,39,0.54)' }}>Loading reviewer panel...</div>}>
          <AdminPanel onBack={() => gs.setScreen(SCREENS.LANDING)} />
        </Suspense>
      )}
    </div>
    </ErrorBoundary>
  );
}
