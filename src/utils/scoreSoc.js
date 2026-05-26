export const SOC_RAW_MAX = 92;
export const SOC_SCALED_MAX = 40;
export const ZONES_RAW_MAX = 60;

export function scaleSocScore(socTotal, zonesRaw) {
  const socScaled = Math.round((socTotal / SOC_RAW_MAX) * SOC_SCALED_MAX);
  const finalScore = zonesRaw + socScaled;
  return { socScaled, finalScore };
}

export function scoreSocRound({ primaryCorrect, secondaryRatio, splValidation }, config) {
  const cfg = config || { primary: 5, secondary: 3, spl: 10 };
  const primaryScore = primaryCorrect ? cfg.primary : 0;
  const secondaryScore = secondaryRatio * cfg.secondary;

  const requiredTotal = splValidation.required.hits.length + splValidation.required.misses.length;
  const optionalTotal = splValidation.optional.hits.length + splValidation.optional.misses.length;
  const requiredRatio = requiredTotal > 0 ? splValidation.required.hits.length / requiredTotal : 0;
  const optionalRatio = optionalTotal > 0 ? splValidation.optional.hits.length / optionalTotal : 0;
  const splScore = Math.min(cfg.spl, Math.max(0, requiredRatio * 7 + optionalRatio * 3 - splValidation.blocked.hits.length * 2));

  const total = Math.round((primaryScore + secondaryScore + splScore) * 100) / 100;

  let grade;
  if (total >= 15) grade = "Strong";
  else if (total >= 11) grade = "Good";
  else if (total >= 7) grade = "Needs improvement";
  else grade = "Not ready";

  return {
    breakdown: {
      primary: Math.round(primaryScore * 100) / 100,
      secondary: Math.round(secondaryScore * 100) / 100,
      spl: Math.round(splScore * 100) / 100,
    },
    total: Math.round(total * 100) / 100,
    grade,
  };
}
