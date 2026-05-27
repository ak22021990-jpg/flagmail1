import { useMemo } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { EMAIL_POOL } from "../data/emails.js";
import { SOC_QUESTIONS } from "../data/socQuestions.js";
import { validateSpl } from "../utils/validateSpl.js";

const sectionHead = { fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(17,24,39,0.48)", marginBottom: 10 };

const sectionCard = {
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(30px) saturate(165%)",
  WebkitBackdropFilter: "blur(30px) saturate(165%)",
  border: "0.5px solid rgba(13,26,51,0.08)",
  borderRadius: 16, padding: 22,
};

function verdictBand(score) {
  const n = Number(score);
  if (isNaN(n)) return { label: "—", bg: "rgba(17,24,39,0.04)", color: "rgba(17,24,39,0.40)", border: "rgba(17,24,39,0.08)" };
  if (n >= 80) return { label: "PASS", bg: "#EAF3DE", color: "#27500A", border: "#C0DD97" };
  if (n >= 60) return { label: "BORDERLINE", bg: "#FAEEDA", color: "#633806", border: "#FAC775" };
  return { label: "FAIL", bg: "#FCEBEB", color: "#791F1F", border: "#F7C1C1" };
}

function gradeColor(grade) {
  const g = (grade || "").toLowerCase();
  if (g === "strong") return { bg: "#EAF3DE", color: "#27500A" };
  if (g === "good") return { bg: "rgba(10,132,255,0.12)", color: "#0A84FF" };
  if (g === "needs improvement") return { bg: "#FAEEDA", color: "#633806" };
  return { bg: "#FCEBEB", color: "#791F1F" };
}

function highlightSpl(splText, questionId) {
  const question = SOC_QUESTIONS.find((q) => q.id === questionId);
  if (!question || !question.splRules || !question.splRules.tasks || !question.splRules.tasks.length) {
    return { elements: <span>{splText || "(empty)"}</span>, missedRequired: [], blockedHits: [] };
  }

  const rules = question.splRules.tasks[0];
  const result = validateSpl(splText, rules);

  const matchedRequired = new Set();
  for (const t of result.required.hits) {
    if (typeof t === "string") matchedRequired.add(t.toLowerCase());
    else if (t.anyOf) t.anyOf.forEach((a) => matchedRequired.add(a.toLowerCase()));
  }
  const matchedOptional = new Set();
  for (const t of result.optional.hits) {
    if (typeof t === "string") matchedOptional.add(t.toLowerCase());
    else if (t.anyOf) t.anyOf.forEach((a) => matchedOptional.add(a.toLowerCase()));
  }
  const missedRequiredLabels = result.required.misses.map((t) =>
    typeof t === "string" ? t : (t.anyOf || []).join(" / ")
  );
  const blockedLabels = result.blocked.hits.map((t) =>
    typeof t === "string" ? t : (t.anyOf || []).join(" / ")
  );

  const allTerms = [
    ...[...matchedRequired].map((t) => ({ term: t, type: "required" })),
    ...[...matchedOptional].map((t) => ({ term: t, type: "optional" })),
  ];
  allTerms.sort((a, b) => b.term.length - a.term.length);

  const segments = [];
  let lastIdx = 0;
  const lower = splText.toLowerCase();

  for (let i = 0; i < lower.length; i++) {
    for (const { term, type } of allTerms) {
      if (lower.startsWith(term, i)) {
        if (i > lastIdx) {
          segments.push({ text: splText.slice(lastIdx, i), type: "normal" });
        }
        segments.push({ text: splText.slice(i, i + term.length), type });
        i += term.length - 1;
        lastIdx = i + 1;
        break;
      }
    }
  }
  if (lastIdx < splText.length) {
    segments.push({ text: splText.slice(lastIdx), type: "normal" });
  }

  const rendered =
    segments.length === 0
      ? splText
      : segments.map((seg, idx) => {
          if (seg.type === "required") {
            return (
              <span key={idx} className="spl-required" style={{ background: "rgba(52,199,89,0.18)", borderRadius: 3, padding: "0 2px" }}>
                {seg.text}
              </span>
            );
          }
          if (seg.type === "optional") {
            return (
              <span key={idx} className="spl-optional" style={{ background: "rgba(10,132,255,0.12)", borderRadius: 3, padding: "0 2px" }}>
                {seg.text}
              </span>
            );
          }
          return <span key={idx}>{seg.text}</span>;
        });

  return {
    elements: <span>{rendered}</span>,
    missedRequired: missedRequiredLabels,
    blockedHits: blockedLabels,
  };
}

export default function AnswerSheet({ candidate, rawData, socData, onBack }) {
  const emailMap = useMemo(() => {
    const map = {};
    for (const e of EMAIL_POOL) map[e.id] = e;
    return map;
  }, []);

  const questionMap = useMemo(() => {
    const map = {};
    for (const q of SOC_QUESTIONS) map[q.id] = q;
    return map;
  }, []);

  const candidateRaw = useMemo(
    () => rawData.filter((r) => (r.email || "") === (candidate.email || "")),
    [rawData, candidate.email]
  );

  const candidateSoc = useMemo(
    () => socData.filter((s) => (s.email || "") === (candidate.email || "")),
    [socData, candidate.email]
  );

  const tabSwitches =
    candidate.tabSwitches !== undefined ? Number(candidate.tabSwitches) : 0;
  const totalScore = candidate.totalScore ?? candidate[6] ?? null;
  const verdict = verdictBand(totalScore);

  return (
    <div
      className="print-target"
      style={{
        minHeight: "100dvh",
        padding: "clamp(18px, 3vw, 30px)",
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 16 }}>
        {/* Nav buttons */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{
              padding: "10px 18px", borderRadius: 14, fontSize: 13, fontWeight: 600,
              border: "0.5px solid rgba(13,26,51,0.10)",
              background: "rgba(249,250,252,0.88)", color: "#111827", cursor: "pointer",
            }}
          >
            {"←"} Back to Candidates
          </motion.button>
          <motion.button
            onClick={() => window.print()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="no-print"
            style={{
              padding: "10px 18px", borderRadius: 14, fontSize: 13, fontWeight: 600,
              border: "0.5px solid rgba(13,26,51,0.12)",
              background: "rgba(249,250,252,0.88)", color: "#111827", cursor: "pointer",
            }}
          >
            Print Report
          </motion.button>
        </div>

        {/* Verdict banner */}
        <div style={{
          borderRadius: 16, padding: "18px 22px",
          background: verdict.bg, border: `0.5px solid ${verdict.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "#111827" }}>
              {candidate.name || "Unknown Candidate"}
            </h2>
            <div style={{ fontSize: 13, color: "rgba(17,24,39,0.54)", marginTop: 2 }}>
              {candidate.email || ""}
              {candidate.submissionDate ? ` · ${candidate.submissionDate}` : ""}
            </div>
            {tabSwitches > 0 && (
              <div style={{ fontSize: 12, color: "#791F1F", fontWeight: 700, marginTop: 6 }}>
                {"⚠"} Proctoring: {tabSwitches} tab switch{tabSwitches !== 1 ? "es" : ""}
              </div>
            )}
          </div>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#111827", lineHeight: 1 }}>
              {totalScore ?? "—"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(17,24,39,0.48)", marginTop: 2 }}>out of 100</div>
            <div style={{
              marginTop: 6, padding: "4px 14px", borderRadius: 20,
              fontSize: 12, fontWeight: 600,
              background: verdict.color, color: "#fff",
              display: "inline-block",
            }}>
              {verdict.label}
            </div>
          </div>
        </div>

        {/* Zone 1-3 Classification Answers */}
        <div style={sectionCard}>
          <div style={sectionHead}>Zone 1-3 Classifications ({candidateRaw.length})</div>
          {candidateRaw.length === 0 ? (
            <div style={{ fontSize: 13, color: "rgba(17,24,39,0.46)", padding: "8px 0" }}>
              No classification data for this candidate.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {candidateRaw.map((row, i) => {
                const emailId = row.emailId || "";
                const email = emailMap[emailId];
                const l1Correct = row.l1Correct === true || row.l1Correct === "true";
                const l2Correct = row.l2Correct === true || row.l2Correct === "true";
                return (
                  <div
                    key={i}
                    style={{
                      border: "0.5px solid rgba(13,26,51,0.06)",
                      borderRadius: 12, padding: 14, display: "grid", gap: 6,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                      {email ? `${email.fromName} — ${email.subject}` : `Email: ${emailId}`}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                      <div>
                        <div style={{ color: "rgba(17,24,39,0.48)", fontSize: 11, marginBottom: 2 }}>Level 1</div>
                        <div>
                          <span style={{ fontWeight: 600 }}>{row.selectedL1 || "-"}</span>{" "}
                          {l1Correct
                            ? <span style={{ color: "#27500A" }}>{"✓"}</span>
                            : <span style={{ color: "#791F1F" }}>{"✗"}</span>
                          }
                        </div>
                        <div style={{ color: "rgba(17,24,39,0.54)", fontSize: 12 }}>
                          Correct: {row.correctL1 || "-"}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: "rgba(17,24,39,0.48)", fontSize: 11, marginBottom: 2 }}>Level 2</div>
                        <div>
                          <span style={{ fontWeight: 600 }}>{row.selectedL2 || "-"}</span>{" "}
                          {l2Correct
                            ? <span style={{ color: "#27500A" }}>{"✓"}</span>
                            : <span style={{ color: "#791F1F" }}>{"✗"}</span>
                          }
                        </div>
                        <div style={{ color: "rgba(17,24,39,0.54)", fontSize: 12 }}>
                          Correct: {row.correctL2 || "-"}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: "#111827" }}>
                        Points: {row.points !== undefined ? Number(row.points) : "-"}
                      </span>
                      <span style={{ color: "rgba(17,24,39,0.54)" }}>
                        Clues: {row.cluesUsed !== undefined ? Number(row.cluesUsed) : 0}
                      </span>
                      <span style={{ color: "rgba(17,24,39,0.54)" }}>
                        Zone: {row.zone !== undefined ? row.zone : "-"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Zone 4 SOC Investigation Answers */}
        <div style={sectionCard}>
          <div style={sectionHead}>Zone 4 SOC Investigation ({candidateSoc.length})</div>
          {candidateSoc.length === 0 ? (
            <div style={{ fontSize: 13, color: "rgba(17,24,39,0.46)", padding: "8px 0" }}>
              No SOC data for this candidate.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {candidateSoc.map((row, i) => {
                const qId = row.questionId || "";
                const question = questionMap[qId];
                const splText = row.splText || "";
                const explanation = row.explanation || "";
                const score = row.score !== undefined ? Number(row.score) : null;
                const rowGrade = row.grade || "-";
                const rowGradeStyle = gradeColor(rowGrade);

                let splHighlight = { elements: <span>{splText || "(empty)"}</span>, missedRequired: [], blockedHits: [] };
                if (splText && qId) {
                  splHighlight = highlightSpl(splText, qId);
                }

                return (
                  <div
                    key={i}
                    style={{
                      border: "0.5px solid rgba(13,26,51,0.06)",
                      borderRadius: 12, padding: 14, display: "grid", gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
                          {qId || "Unknown"}
                        </span>
                        {question && (
                          <span style={{ fontSize: 12, color: "rgba(17,24,39,0.48)", marginLeft: 8 }}>
                            {question.scenario}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {score !== null && (
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                            {score}
                          </span>
                        )}
                        <span style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: rowGradeStyle.bg, color: rowGradeStyle.color,
                        }}>
                          {rowGrade}
                        </span>
                      </div>
                    </div>

                    {question && question.classification && question.classification.correct && (
                      <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                        <span style={{ color: "rgba(17,24,39,0.54)" }}>
                          Correct primary: <span style={{ fontWeight: 600, color: "#111827" }}>{question.classification.correct.primary}</span>
                        </span>
                        <span style={{ color: "rgba(17,24,39,0.54)" }}>
                          Correct secondary: <span style={{ fontWeight: 600, color: "#111827" }}>{question.classification.correct.secondary}</span>
                        </span>
                      </div>
                    )}

                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "rgba(17,24,39,0.48)", marginBottom: 4 }}>
                        SPL Query
                      </div>
                      <pre style={{
                        margin: 0, padding: "10px 12px", borderRadius: 10,
                        background: "rgba(13,26,51,0.03)", fontSize: 12,
                        fontFamily: 'ui-monospace, "SF Mono", monospace',
                        whiteSpace: "pre-wrap", wordBreak: "break-word",
                        color: "#111827", lineHeight: 1.5,
                      }}>
                        {splHighlight.elements}
                      </pre>
                      {splHighlight.missedRequired.length > 0 && (
                        <div style={{ marginTop: 6, fontSize: 12, color: "#791F1F" }}>
                          Missing required: {splHighlight.missedRequired.join(", ")}
                        </div>
                      )}
                      {splHighlight.blockedHits.length > 0 && (
                        <div style={{ marginTop: 4, fontSize: 12, color: "#633806" }}>
                          Blocked terms: {splHighlight.blockedHits.join(", ")}
                        </div>
                      )}
                    </div>

                    {explanation && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "rgba(17,24,39,0.48)", marginBottom: 4 }}>
                          Explanation
                        </div>
                        <pre style={{
                          margin: 0, padding: "10px 12px", borderRadius: 10,
                          background: "rgba(13,26,51,0.03)", fontSize: 12,
                          fontFamily: 'ui-monospace, "SF Mono", monospace',
                          whiteSpace: "pre-wrap", wordBreak: "break-word",
                          color: "#111827", lineHeight: 1.5,
                        }}>
                          {explanation}
                        </pre>
                      </div>
                    )}

                    {splText && qId && (
                      <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
                        <span>
                          <span style={{ background: "rgba(52,199,89,0.18)", borderRadius: 3, padding: "0 4px" }}>Required</span> matched
                        </span>
                        <span>
                          <span style={{ background: "rgba(10,132,255,0.12)", borderRadius: 3, padding: "0 4px" }}>Optional</span> matched
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

AnswerSheet.propTypes = {
  candidate: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    totalScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    gradeBand: PropTypes.string,
    submissionDate: PropTypes.string,
    tabSwitches: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
  rawData: PropTypes.array.isRequired,
  socData: PropTypes.array.isRequired,
  onBack: PropTypes.func.isRequired,
};
