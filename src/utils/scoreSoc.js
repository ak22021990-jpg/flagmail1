export function scoreSocRound({ primaryCorrect, secondaryRatio, splValidation, explanationValidation }, config) {
  const cfg = config || { primary: 5, secondary: 3, spl: 10, explanation: 5 };
  const primaryScore = primaryCorrect ? cfg.primary : 0;
  const secondaryScore = secondaryRatio * cfg.secondary;

  const requiredTotal = splValidation.required.hits.length + splValidation.required.misses.length;
  const optionalTotal = splValidation.optional.hits.length + splValidation.optional.misses.length;
  const requiredRatio = requiredTotal > 0 ? splValidation.required.hits.length / requiredTotal : 0;
  const optionalRatio = optionalTotal > 0 ? splValidation.optional.hits.length / optionalTotal : 0;
  const splScore = Math.min(cfg.spl, Math.max(0, requiredRatio * 7 + optionalRatio * 3 - splValidation.blocked.hits.length * 2));

  const expRequiredTotal = explanationValidation.required.hits.length + explanationValidation.required.misses.length;
  const expOptionalTotal = explanationValidation.optional.hits.length + explanationValidation.optional.misses.length;
  const expRequiredRatio = expRequiredTotal > 0 ? explanationValidation.required.hits.length / expRequiredTotal : 0;
  const expOptionalRatio = expOptionalTotal > 0 ? explanationValidation.optional.hits.length / expOptionalTotal : 0;
  const explanationScore = Math.min(cfg.explanation, expRequiredRatio * 3 + expOptionalRatio * 2);

  const total = Math.round((primaryScore + secondaryScore + splScore + explanationScore) * 100) / 100;

  let grade;
  if (total >= 20) grade = "Strong";
  else if (total >= 15) grade = "Good";
  else if (total >= 10) grade = "Needs improvement";
  else grade = "Not ready";

  return {
    breakdown: {
      primary: Math.round(primaryScore * 100) / 100,
      secondary: Math.round(secondaryScore * 100) / 100,
      spl: Math.round(splScore * 100) / 100,
      explanation: Math.round(explanationScore * 100) / 100,
    },
    total: Math.round(total * 100) / 100,
    grade,
  };
}
