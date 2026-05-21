import { describe, it, expect } from "vitest";
import { validateSpl, validateExplanation } from "./validateSpl.js";

describe("validateSpl", () => {
  const rules = {
    required: ["index=email", "subject", "sender"],
    optional: ["url", "stats"],
    blocked: ["delete", "outputlookup"],
  };

  it("hits all required and optional when present", () => {
    const result = validateSpl("index=email subject=\"*test*\" | stats count by sender url", rules);
    expect(result.required.hits).toHaveLength(3);
    expect(result.required.misses).toHaveLength(0);
    expect(result.optional.hits).toHaveLength(2);
    expect(result.optional.misses).toHaveLength(0);
    expect(result.blocked.hits).toHaveLength(0);
  });

  it("reports misses for missing required terms", () => {
    const result = validateSpl("index=email url=foo", rules);
    expect(result.required.hits).toHaveLength(1);
    expect(result.required.misses).toHaveLength(2);
    expect(result.required.misses).toContain("subject");
    expect(result.required.misses).toContain("sender");
  });

  it("detects blocked terms", () => {
    const result = validateSpl("index=email sender=x subject=y | delete", rules);
    expect(result.blocked.hits).toHaveLength(1);
    expect(result.blocked.hits[0]).toBe("delete");
  });

  it("normalizes whitespace", () => {
    const result = validateSpl("index=email   subject=\"*x*\"    sender=y", rules);
    expect(result.required.hits).toHaveLength(3);
  });

  it("is case insensitive", () => {
    const result = validateSpl("INDEX=EMAIL SUBJECT=\"*test*\" SENDER=y", rules);
    expect(result.required.hits).toHaveLength(3);
  });

  it("handles anyOf terms", () => {
    const result = validateSpl("index=email | stats values(x) by sender", {
      required: [{ anyOf: ["values", "values()"] }, "stats"],
    });
    expect(result.required.hits).toHaveLength(2);
  });

  it("treats empty string as no match", () => {
    const result = validateSpl("", rules);
    expect(result.required.hits).toHaveLength(0);
    expect(result.required.misses).toHaveLength(3);
    expect(result.optional.hits).toHaveLength(0);
    expect(result.blocked.hits).toHaveLength(0);
  });

  it("survives missing optional and blocked arrays", () => {
    const result = validateSpl("index=email", { required: ["index=email"] });
    expect(result.required.hits).toHaveLength(1);
    expect(result.optional.hits).toHaveLength(0);
    expect(result.blocked.hits).toHaveLength(0);
  });
});

describe("validateExplanation", () => {
  const concepts = {
    required: ["credential", "phishing"],
    optional: ["harvesting", "urgency"],
  };

  it("hits required and optional when present", () => {
    const result = validateExplanation("The phishing attack targets credential harvesting using urgency", concepts);
    expect(result.required.hits).toHaveLength(2);
    expect(result.optional.hits).toHaveLength(2);
  });

  it("reports misses for missing concepts", () => {
    const result = validateExplanation("It was a spam email", concepts);
    expect(result.required.hits).toHaveLength(0);
    expect(result.required.misses).toHaveLength(2);
    expect(result.optional.hits).toHaveLength(0);
  });

  it("matches concept keywords case-insensitively", () => {
    const result = validateExplanation("CREDENTIAL PHISHING HARVESTING", concepts);
    expect(result.required.hits).toHaveLength(2);
    expect(result.optional.hits).toHaveLength(1);
  });
});
