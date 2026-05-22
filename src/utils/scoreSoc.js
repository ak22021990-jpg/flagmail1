export const SOC_RAW_MAX = 112;
export const SOC_SCALED_MAX = 40;
export const ZONES_RAW_MAX = 60;

/**
 * Scale socTotal (0-112 raw) to 40 points and compute the combined final score.
 * @param {number} socTotal  Raw SOC score (sum of per-question result.score.total)
 * @param {number} zonesRaw  Zones 1-3 raw total (0-60)
 * @returns {{ socScaled: number, finalScore: number }}
 */
export function scaleSocScore(socTotal, zonesRaw) {
  const socScaled = Math.round((socTotal / SOC_RAW_MAX) * SOC_SCALED_MAX);
  const finalScore = zonesRaw + socScaled;
  return { socScaled, finalScore };
}

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
