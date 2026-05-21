import { describe, it, expect } from "vitest";
import { scoreSocRound } from "./scoreSoc.js";

function makeSpl(requiredHits, requiredTotal, optionalHits, optionalTotal, blockedHits = 0) {
  return {
    required: { hits: Array(requiredHits).fill("x"), misses: Array(requiredTotal - requiredHits).fill("x") },
    optional: { hits: Array(optionalHits).fill("x"), misses: Array(optionalTotal - optionalHits).fill("x") },
    blocked: { hits: Array(blockedHits).fill("x") },
  };
}

function makeExp(requiredHits, requiredTotal, optionalHits, optionalTotal) {
  return {
    required: { hits: Array(requiredHits).fill("x"), misses: Array(requiredTotal - requiredHits).fill("x") },
    optional: { hits: Array(optionalHits).fill("x"), misses: Array(optionalTotal - optionalHits).fill("x") },
  };
}

describe("scoreSocRound", () => {
  it("perfect score is 23", () => {
    const result = scoreSocRound({
      primaryCorrect: true,
      secondaryRatio: 1,
      splValidation: makeSpl(5, 5, 3, 3),
      explanationValidation: makeExp(3, 3, 2, 2),
    });
    expect(result.breakdown.primary).toBe(5);
    expect(result.breakdown.secondary).toBe(3);
    expect(result.breakdown.spl).toBe(10);
    expect(result.breakdown.explanation).toBe(5);
    expect(result.total).toBe(23);
    expect(result.grade).toBe("Strong");
  });

  it("score of 20 produces Strong", () => {
    const result = scoreSocRound({
      primaryCorrect: true,
      secondaryRatio: 1,
      splValidation: makeSpl(4, 5, 2, 3),
      explanationValidation: makeExp(3, 3, 2, 2),
    });
    expect(result.grade).toBe("Strong");
  });

  it("score of 19 produces Good", () => {
    const result = scoreSocRound({
      primaryCorrect: true,
      secondaryRatio: 1,
      splValidation: makeSpl(4, 5, 2, 3),
      explanationValidation: makeExp(2, 3, 1, 2),
    });
    expect(result.total).toBeLessThan(20);
    expect(result.grade).toBe("Good");
  });

  it("score floor at 0 when blocked terms push negative", () => {
    const result = scoreSocRound({
      primaryCorrect: false,
      secondaryRatio: 0,
      splValidation: makeSpl(0, 3, 0, 2, 10),
      explanationValidation: makeExp(0, 3, 0, 2),
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
      explanationValidation: makeExp(3, 3, 2, 2),
    });
    expect(result.breakdown.secondary).toBe(3);
    expect(result.total).toBe(23);
  });

  it("compound secondary partial credit (1 of 2 correct)", () => {
    const result = scoreSocRound({
      primaryCorrect: true,
      secondaryRatio: 0.5,
      splValidation: makeSpl(5, 5, 3, 3),
      explanationValidation: makeExp(3, 3, 2, 2),
    });
    expect(result.breakdown.secondary).toBe(1.5);
    expect(result.total).toBe(21.5);
  });

  it("all zeros gives Not ready", () => {
    const result = scoreSocRound({
      primaryCorrect: false,
      secondaryRatio: 0,
      splValidation: makeSpl(0, 3, 0, 1),
      explanationValidation: makeExp(0, 2, 0, 1),
    });
    expect(result.total).toBe(0);
    expect(result.grade).toBe("Not ready");
  });

  it("Needs improvement grade (10-14)", () => {
    const result = scoreSocRound({
      primaryCorrect: true,
      secondaryRatio: 0,
      splValidation: makeSpl(2, 5, 1, 3),
      explanationValidation: makeExp(1, 3, 1, 2),
    });
    expect(result.total).toBeGreaterThanOrEqual(10);
    expect(result.total).toBeLessThan(15);
    expect(result.grade).toBe("Needs improvement");
  });

  it("explanation score capped at 5", () => {
    const result = scoreSocRound({
      primaryCorrect: true,
      secondaryRatio: 1,
      splValidation: makeSpl(5, 5, 3, 3),
      explanationValidation: makeExp(10, 10, 10, 10),
    });
    expect(result.breakdown.explanation).toBe(5);
    expect(result.total).toBe(23);
  });
});
