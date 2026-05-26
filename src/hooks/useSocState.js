import { useState, useCallback, useMemo, useEffect } from "react";
import { SOC_QUESTIONS } from "../data/socQuestions.js";
import { validateSpl } from "../utils/validateSpl.js";
import { scoreSocRound } from "../utils/scoreSoc.js";
import { LEADERBOARD_URL } from "../config.js";

const QUESTION_SCORE_MAP = {
  Q1: { primary: 5, secondary: 3, spl: 10 },
  Q2: { primary: 5, secondary: 3, spl: 10 },
  Q3: { primary: 5, secondary: 3, spl: 10 },
  Q4: { primary: 5, secondary: 3, spl: 10 },
  Q5a: { primary: 5, secondary: 3, spl: 2 },
  Q5b: { primary: 0, secondary: 0, spl: 10 },
};

function initialAnswers() {
  return SOC_QUESTIONS.map(() => ({
    primary: null,
    secondary: null,
    splText: "",
    submitted: false,
    result: null,
  }));
}

export function useSocState(gs) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [showResults, setShowResults] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    setHintIndex(0);
  }, [currentQuestionIdx]);

  const totalQuestions = SOC_QUESTIONS.length;
  const currentQuestion = SOC_QUESTIONS[currentQuestionIdx];
  const currentAnswer = answers[currentQuestionIdx];

  const progress = useMemo(() => ({
    current: currentQuestionIdx + 1,
    total: totalQuestions,
  }), [currentQuestionIdx, totalQuestions]);

  const setPrimary = useCallback((value) => {
    setAnswers(prev => {
      const next = [...prev];
      next[currentQuestionIdx] = { ...next[currentQuestionIdx], primary: value, secondary: null };
      return next;
    });
  }, [currentQuestionIdx]);

  const setSecondary = useCallback((value) => {
    setAnswers(prev => {
      const q = SOC_QUESTIONS[currentQuestionIdx];
      const isCompound = q.classification && Array.isArray(q.classification.correct.secondary);
      if (isCompound) {
        const current = Array.isArray(prev[currentQuestionIdx].secondary) ? prev[currentQuestionIdx].secondary : [];
        const nextVal = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
        const next = [...prev];
        next[currentQuestionIdx] = { ...next[currentQuestionIdx], secondary: nextVal };
        return next;
      }
      const next = [...prev];
      next[currentQuestionIdx] = { ...next[currentQuestionIdx], secondary: value };
      return next;
    });
  }, [currentQuestionIdx]);

  const setSplText = useCallback((text) => {
    setAnswers(prev => {
      const next = [...prev];
      next[currentQuestionIdx] = { ...next[currentQuestionIdx], splText: text };
      return next;
    });
  }, [currentQuestionIdx]);

  const submitSocRound = useCallback(() => {
    const q = currentQuestion;
    const a = answers[currentQuestionIdx];
    if (!q || !a || a.submitted) return;

    const classifyCorrect = q.classification;
    let primaryCorrect = false;
    let secondaryRatio = 0;

    if (classifyCorrect) {
      primaryCorrect = a.primary === classifyCorrect.correct.primary;
      if (Array.isArray(classifyCorrect.correct.secondary)) {
        const correctSet = new Set(classifyCorrect.correct.secondary);
        const selected = Array.isArray(a.secondary) ? a.secondary : [a.secondary];
        const hits = selected.filter(s => correctSet.has(s)).length;
        secondaryRatio = hits / correctSet.size;
      } else {
        secondaryRatio = a.secondary === classifyCorrect.correct.secondary ? 1 : 0;
      }
    }

    const splResult = { required: { hits: [], misses: [] }, optional: { hits: [], misses: [] }, blocked: { hits: [] } };

    if (q.splRules && q.splRules.tasks && q.splRules.tasks.length > 0) {
      for (const task of q.splRules.tasks) {
        const r = validateSpl(a.splText, task);
        splResult.required.hits.push(...r.required.hits);
        splResult.required.misses.push(...r.required.misses);
        splResult.optional.hits.push(...r.optional.hits);
        splResult.optional.misses.push(...r.optional.misses);
        splResult.blocked.hits.push(...r.blocked.hits);
      }
    }

    const scoreConfig = QUESTION_SCORE_MAP[q.id];
    const scoreResult = scoreSocRound({
      primaryCorrect,
      secondaryRatio,
      splValidation: splResult,
    }, scoreConfig);

    const record = {
      questionId: q.id,
      primaryCorrect,
      secondaryRatio,
      splValidation: splResult,
      score: scoreResult,
    };

    setAnswers(prev => {
      const next = [...prev];
      next[currentQuestionIdx] = { ...next[currentQuestionIdx], submitted: true, result: record };
      return next;
    });
  }, [currentQuestion, currentQuestionIdx, answers]);

  const nextQuestion = useCallback(() => {
    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx >= totalQuestions) {
      setShowResults(true);
      return false;
    } else {
      setCurrentQuestionIdx(nextIdx);
      return true;
    }
  }, [currentQuestionIdx, totalQuestions]);

  const revealHint = useCallback(() => {
    setHintIndex(prev => Math.min(prev + 1, currentQuestion.hints?.length || 0));
  }, [currentQuestion]);

  const hasMoreQuestions = currentQuestionIdx < totalQuestions - 1;

  const allResults = useMemo(() => {
    return answers
      .filter(a => a.submitted && a.result)
      .map(a => a.result);
  }, [answers]);

  const socTotal = useMemo(() => {
    return answers
      .filter(a => a.submitted && a.result)
      .reduce((sum, a) => sum + (a.result.score.total || 0), 0);
  }, [answers]);

  const submitFinal = useCallback(async (consolidatedPayload) => {
    try {
      sessionStorage.setItem("socSubmission", JSON.stringify(consolidatedPayload));
    } catch (_) {}

    try {
      if (!LEADERBOARD_URL || LEADERBOARD_URL === "YOUR_APPS_SCRIPT_URL") return;
      if (!consolidatedPayload) return;
      await fetch(LEADERBOARD_URL, {
        method: "POST",
        body: JSON.stringify({ action: "submitFinal", ...consolidatedPayload }),
        mode: "no-cors",
      });
    } catch (_) {}
  }, []);

  return {
    currentQuestion,
    currentAnswer,
    currentQuestionIdx,
    progress,
    answers,
    showResults,
    allResults,
    socTotal,
    hasMoreQuestions,
    setPrimary,
    setSecondary,
    setSplText,
    submitSocRound,
    submitFinal,
    nextQuestion,
    hintIndex,
    revealHint,
  };
}
