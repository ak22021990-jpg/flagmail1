import { describe, it, expect } from "vitest";
import { scoreSocRound } from "./scoreSoc.js";

function makeSpl(requiredHits, requiredTotal, optionalHits, optionalTotal, blockedHits = 0) {
  return {
    required: { hits: Array(requiredHits).fill("x"), misses: Array(requiredTotal - requiredHits).fill("x") },
    optional: { hits: Array(optionalHits).fill("x"), misses: Array(optionalTotal - optionalHits).fill("x") },
    blocked: { hits: Array(blockedHits).fill("x") },
  };
}

describe("scoreSocRound", () => {
  it("perfect score is 18", () => {
    const result = scoreSocRound({
      primaryCorrect: true,
      secondaryRatio: 1,
      splValidation: makeSpl(5, 5, 3, 3),
    });
    expect(result.breakdown.primary).toBe(5);
    expect(result.breakdown.secondary).toBe(3);
    expect(result.breakdown.spl).toBe(10);
    expect(result.total).toBe(18);
    expect(result.grade).toBe("Strong");
  });

  it("score of 15 produces Strong", () => {
    const result = scoreSocRound({
      primaryCorrect: true,
      secondaryRatio: 1,
      splValidation: makeSpl(4, 5, 2, 3),
    });
    expect(result.total).toBeGreaterThanOrEqual(15);
    expect(result.grade).toBe("Strong");
  });

  it("score of 14 produces Good", () => {
    const result = scoreSocRound({
      primaryCorrect: true,
      secondaryRatio: 1,
      splValidation: makeSpl(3, 5, 1, 3),
    });
    expect(result.total).toBeGreaterThanOrEqual(11);
    expect(result.total).toBeLessThan(15);
    expect(result.grade).toBe("Good");
  });

  it("score floor at 0 when blocked terms push negative", () => {
    const result = scoreSocRound({
      primaryCorrect: false,
      secondaryRatio: 0,
      splValidation: makeSpl(0, 3, 0, 2, 10),
    });
    expect(result.breakdown.spl).toBe(0);
    expect(result.total).toBe(0);
    expect(result.grade).toBe("Not ready");
  });

  it("compound secondary partial credit (Q5a 2 correct)", () => {
    const result = scoreSocRound({
      primaryCorrect: true,
      secondaryRatio: 2 / 2,
      splValidation: makeSpl(5, 5, 3, 3),
    });
    expect(result.breakdown.secondary).toBe(3);
    expect(result.total).toBe(18);
  });

  it("compound secondary partial credit (1 of 2 correct)", () => {
    const result = scoreSocRound({
      primaryCorrect: true,
      secondaryRatio: 0.5,
      splValidation: makeSpl(5, 5, 3, 3),
    });
    expect(result.breakdown.secondary).toBe(1.5);
    expect(result.total).toBe(16.5);
  });

  it("all zeros gives Not ready", () => {
    const result = scoreSocRound({
      primaryCorrect: false,
      secondaryRatio: 0,
      splValidation: makeSpl(0, 3, 0, 1),
    });
    expect(result.total).toBe(0);
    expect(result.grade).toBe("Not ready");
  });

  it("Needs improvement grade (7-10)", () => {
    const result = scoreSocRound({
      primaryCorrect: true,
      secondaryRatio: 0,
      splValidation: makeSpl(2, 5, 1, 3),
    });
    expect(result.total).toBeGreaterThanOrEqual(7);
    expect(result.total).toBeLessThan(11);
    expect(result.grade).toBe("Needs improvement");
  });
});
