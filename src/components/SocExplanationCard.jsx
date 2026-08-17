import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { glass } from "../styles/tokens.js";
import HintPanel from "./HintPanel.jsx";

// SocExplanationCard uses softer blur and border
const localGlass = { ...glass, backdropFilter: "blur(24px) saturate(155%)", WebkitBackdropFilter: "blur(24px) saturate(155%)", border: "1px solid rgba(255,255,255,0.82)", boxShadow: "0 24px 80px rgba(32, 52, 89, 0.10), 0 8px 24px rgba(32, 52, 89, 0.05)" };

function FeedbackLabel({ label, pass }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
      background: pass ? "rgba(52,199,89,0.12)" : "rgba(255,59,48,0.10)",
      color: pass ? "#34C759" : "#FF3B30",
    }}>
      {pass ? "Correct" : "Missed"}
    </span>
  );
}

function KeywordList({ label, items, pass }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(17,24,39,0.48)", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {items.map((item, i) => (
          <span key={i} style={{
            padding: "2px 8px", borderRadius: 6, fontSize: 11,
            fontFamily: 'ui-monospace, "SF Mono", monospace',
            background: pass ? "rgba(52,199,89,0.08)" : "rgba(255,59,48,0.08)",
            color: pass ? "#34C759" : "#FF3B30",
            border: `1px solid ${pass ? "rgba(52,199,89,0.16)" : "rgba(255,59,48,0.16)"}`,
          }}>
            {typeof item === "string" ? item : item.anyOf ? item.anyOf.join(" | ") : JSON.stringify(item)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SocExplanationCard({ result, question, hasMore, onNext, hintIndex, onRevealHint }) {
  const { score, splValidation, primaryCorrect, secondaryRatio } = result;
  const { breakdown, total, grade } = score;

  const SCORE_MAXES = {
    Q1: { primary: 5, secondary: 3, spl: 10 },
    Q2: { primary: 5, secondary: 3, spl: 10 },
    Q3: { primary: 5, secondary: 3, spl: 10 },
    Q4: { primary: 5, secondary: 3, spl: 10 },
    Q5a: { primary: 5, secondary: 3, spl: 2 },
    Q5b: { primary: 0, secondary: 0, spl: 10 },
  };
  const maxes = SCORE_MAXES[result.questionId] || SCORE_MAXES.Q1;
  const questionMax = maxes.primary + maxes.secondary + maxes.spl;

  const gradeColor = grade === "Strong" ? "#34C759" : grade === "Good" ? "#0A84FF" : grade === "Needs improvement" ? "#FF9500" : "#FF3B30";

  const splPass = splValidation.required.misses.length === 0 && splValidation.blocked.hits.length === 0;

  return (
    <div style={{
      minHeight: "100dvh", padding: "20px 16px 28px",
      fontFamily: 'system-ui, sans-serif',
      position: "relative",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: [
          `radial-gradient(circle at 16% 14%, ${gradeColor}14, transparent 26%)`,
          "radial-gradient(circle at 84% 10%, rgba(255,255,255,0.72), transparent 20%)",
          "radial-gradient(circle at 50% 84%, rgba(17,24,39,0.05), transparent 26%)",
        ].join(","),
      }} />

      <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", display: "grid", gap: 14 }}>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
           style={{ ...localGlass, borderRadius: 30, padding: "20px 22px", display: "grid", gap: 16 }}
        >
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.15fr) minmax(280px, 0.85fr)",
            gap: 16, alignItems: "start",
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(17,24,39,0.48)", marginBottom: 8 }}>
                Question Review
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                <span style={{
                  padding: "8px 14px", borderRadius: 999,
                  background: `${gradeColor}12`, border: `1px solid ${gradeColor}24`,
                  color: gradeColor, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
                }}>
                  {grade}
                </span>
                <span style={{ fontSize: 30, lineHeight: 1, fontWeight: 800, letterSpacing: "-0.05em", color: "#111827" }}>
                  {total} / {questionMax} pts
                </span>
              </div>
            </div>

            <div style={{
              borderRadius: 24, padding: 16,
              background: "rgba(249,250,252,0.84)", border: "1px solid rgba(13,26,51,0.06)",
              display: "grid", gap: 8,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(17,24,39,0.48)" }}>
                Score Breakdown
              </div>
              {[
                { label: "Primary", pts: breakdown.primary, max: maxes.primary },
                { label: "Secondary", pts: breakdown.secondary, max: maxes.secondary },
                { label: "SPL query", pts: breakdown.spl, max: maxes.spl },
              ].filter(row => row.max > 0).map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                  <span style={{ color: "rgba(17,24,39,0.58)" }}>{row.label}</span>
                  <span style={{ fontWeight: 700, color: row.pts >= row.max ? "#34C759" : "#111827" }}>
                    {row.pts}/{row.max}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.08fr) minmax(320px, 0.92fr)", gap: 14, alignItems: "start" }}>
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ ...localGlass, borderRadius: 28, padding: 18, display: "grid", gap: 14 }}
          >
            <div style={sectionLabel}>Question</div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: "#1C1C1E" }}>
              {question.scenario}
            </div>

            <div style={sectionLabel}>SPL Validation</div>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FeedbackLabel label="Required terms" pass={splValidation.required.misses.length === 0} />
                <span style={{ fontSize: 12, color: "rgba(17,24,39,0.50)" }}>
                  {splValidation.required.hits.length} hit, {splValidation.required.misses.length} miss
                </span>
              </div>
              <KeywordList label="Hits" items={splValidation.required.hits} pass />
              <KeywordList label="Missed" items={splValidation.required.misses} pass={false} />
              {splValidation.blocked.hits.length > 0 && (
                <KeywordList label="Blocked terms detected" items={splValidation.blocked.hits} pass={false} />
              )}
            </div>

          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              ...localGlass, borderRadius: 28, padding: 18,
              display: "grid", gap: 14, position: "sticky", top: 20,
            }}
          >
            <div style={{
              borderRadius: 22, padding: 16,
              background: `linear-gradient(180deg, ${gradeColor}10 0%, rgba(255,255,255,0.90) 100%)`,
              border: `1px solid ${gradeColor}20`, display: "grid", gap: 10,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(17,24,39,0.48)" }}>
                Grade
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", color: gradeColor }}>
                {grade}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: "rgba(17,24,39,0.64)" }}>
                {grade === "Strong" && "Excellent work. Your response hit all key requirements across every dimension."}
                {grade === "Good" && "Solid effort. Review the missed items above to strengthen your next response."}
                {grade === "Needs improvement" && "Some key elements were missing. Focus on covering all required terms and concepts."}
                {grade === "Not ready" && "Review the material and try again. Most required terms and concepts were missed."}
              </div>
            </div>

            <div style={{
              borderRadius: 22, padding: 16,
              background: "rgba(249,250,252,0.84)", border: "1px solid rgba(13,26,51,0.06)",
              display: "grid", gap: 10,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(17,24,39,0.48)" }}>
                Classification
              </div>
              {question.classification && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "rgba(17,24,39,0.58)" }}>Primary & Secondary</span>
                    <span style={{ fontWeight: 700, color: "#111827" }}>
                      {Math.round(breakdown.primary + breakdown.secondary)} / {maxes.primary + maxes.secondary}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "rgba(17,24,39,0.65)" }}>
                    {primaryCorrect
                      ? (question.feedback?.primaryCorrect || "Primary classification correct.")
                      : (question.feedback?.primaryIncorrect || "Primary classification incorrect.")}
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "rgba(17,24,39,0.65)" }}>
                    {secondaryRatio >= 1
                      ? (question.feedback?.secondaryCorrect || "Secondary diagnosis correct.")
                      : (question.feedback?.secondaryIncorrect || "Secondary diagnosis needs review.")}
                  </div>
                </>
              )}
              {!question.classification && (
                <div style={{ fontSize: 13, color: "rgba(17,24,39,0.54)" }}>
                  No classification required for this sub-question
                </div>
              )}
            </div>

            <div style={{
              borderRadius: 22, padding: 16,
              background: "rgba(249,250,252,0.84)", border: "1px solid rgba(13,26,51,0.06)",
              display: "grid", gap: 10,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(17,24,39,0.48)" }}>
                SPL Query
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "rgba(17,24,39,0.58)" }}>Score</span>
                <span style={{ fontWeight: 700, color: "#111827" }}>
                  {Math.round(breakdown.spl)} / {maxes.spl}
                </span>
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "rgba(17,24,39,0.65)" }}>
                {splValidation.required.misses.length === 0 && splValidation.blocked.hits.length === 0
                  ? "All required SPL terms matched. Query syntax is clean."
                  : [
                      splValidation.required.misses.length > 0
                        ? `Missed ${splValidation.required.misses.length} required term${splValidation.required.misses.length > 1 ? "s" : ""}: ${splValidation.required.misses.join(", ")}`
                        : null,
                      splValidation.blocked.hits.length > 0
                        ? `Blocked term${splValidation.blocked.hits.length > 1 ? "s" : ""} detected: ${splValidation.blocked.hits.join(", ")}`
                        : null,
                    ].filter(Boolean).join(". ")
                }
              </div>
            </div>

            {question.hints && question.hints.length > 0 && (
              <HintPanel
                hints={question.hints}
                revealedCount={hintIndex}
                onReveal={onRevealHint}
              />
            )}

            <motion.button
              onClick={onNext}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                width: "100%", padding: "16px 18px", borderRadius: 18,
                border: "1px solid rgba(123,45,142,0.24)",
                background: "linear-gradient(135deg, #7B2D8E 0%, #5A1D6E 100%)",
                color: "#fff", fontSize: 15, fontWeight: 700, letterSpacing: "0.01em",
                boxShadow: "0 18px 30px rgba(123,45,142,0.24)",
              }}
            >
              {hasMore ? "Next question" : "See results"}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

SocExplanationCard.propTypes = {
  result: PropTypes.shape({
    score: PropTypes.shape({
      breakdown: PropTypes.shape({
        primary: PropTypes.number.isRequired,
        secondary: PropTypes.number.isRequired,
        spl: PropTypes.number.isRequired,
      }).isRequired,
      total: PropTypes.number.isRequired,
      grade: PropTypes.string.isRequired,
    }).isRequired,
    splValidation: PropTypes.shape({
      required: PropTypes.shape({
        hits: PropTypes.arrayOf(PropTypes.string).isRequired,
        misses: PropTypes.arrayOf(PropTypes.string).isRequired,
      }).isRequired,
      blocked: PropTypes.shape({
        hits: PropTypes.arrayOf(PropTypes.string).isRequired,
      }).isRequired,
    }).isRequired,
    primaryCorrect: PropTypes.bool.isRequired,
    secondaryRatio: PropTypes.number.isRequired,
    questionId: PropTypes.string,
  }).isRequired,
  question: PropTypes.shape({
    scenario: PropTypes.string.isRequired,
    classification: PropTypes.shape({
      options: PropTypes.object,
    }),
    feedback: PropTypes.shape({
      primaryCorrect: PropTypes.string,
      primaryIncorrect: PropTypes.string,
      secondaryCorrect: PropTypes.string,
      secondaryIncorrect: PropTypes.string,
    }),
    hints: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  hasMore: PropTypes.bool.isRequired,
  onNext: PropTypes.func.isRequired,
  hintIndex: PropTypes.number,
  onRevealHint: PropTypes.func,
};

const sectionLabel = {
  fontSize: 11, fontWeight: 700, color: "rgba(17,24,39,0.52)",
  letterSpacing: "0.12em", textTransform: "uppercase",
};
