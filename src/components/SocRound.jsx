import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { useProctoring } from "../hooks/useProctoring.js";

const surface = {
  background: "rgba(255,255,255,0.74)",
  backdropFilter: "blur(30px) saturate(165%)",
  WebkitBackdropFilter: "blur(30px) saturate(165%)",
  border: "1px solid rgba(255,255,255,0.84)",
  boxShadow: "0 24px 80px rgba(32, 52, 89, 0.11), 0 8px 24px rgba(32, 52, 89, 0.06)",
};

const sectionLabel = {
  fontSize: 11, fontWeight: 700, color: "rgba(17,24,39,0.52)",
  letterSpacing: "0.12em", textTransform: "uppercase",
};

export default function SocRound({
  question, answer, progress,
  onSetPrimary, onSetSecondary,
  onSetSplText,
  onSubmit,
  onViolation,
}) {
  const { violations, switchedAway } = useProctoring({ active: !answer.submitted, onViolation });

  const canSubmit = !!answer.splText?.trim() && !answer.submitted;
  const hasClassification = !!question.classification;

  const primaryOptions = hasClassification ? question.classification.options.primary : [];
  const secondaryOptions = hasClassification ? question.classification.options.secondary : [];

  return (
    <div style={{
      minHeight: "100dvh",
      padding: "18px clamp(12px, 2.5vw, 24px)",
      fontFamily: 'system-ui, sans-serif',
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: [
          "radial-gradient(circle at 14% 18%, #7B2D8E16, transparent 24%)",
          "radial-gradient(circle at 82% 12%, rgba(255,255,255,0.62), transparent 20%)",
          "radial-gradient(circle at 48% 84%, rgba(17,24,39,0.06), transparent 28%)",
        ].join(","),
      }} />

      <div style={{ maxWidth: 1400, margin: "0 auto", position: "relative", display: "grid", gap: 14 }}>
        {(switchedAway || violations > 0) && (
          <div style={{
            display: "inline-flex",
            alignSelf: "start",
            padding: "5px 12px",
            borderRadius: 999,
            background: "rgba(255,184,0,0.15)",
            border: "1px solid rgba(255,184,0,0.40)",
            color: "#92400E",
            fontSize: 12,
            fontWeight: 600,
          }}>
            {switchedAway
              ? `Tab switch detected${violations > 1 ? ` (${violations})` : ""} — stay on this page`
              : `Returned — ${violations} tab switch${violations === 1 ? "" : "es"} recorded`}
          </div>
        )}

        <div style={{
          ...surface, borderRadius: 30, padding: "14px 18px",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto",
            gap: 14, alignItems: "center",
          }}>
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              }}>
                <span style={{
                  padding: "4px 10px", borderRadius: 999,
                  background: "#7B2D8E12", color: "#7B2D8E",
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                }}>
                  SOC Investigation
                </span>
                <span style={{ fontSize: 13, color: "rgba(17,24,39,0.58)" }}>
                  Question {progress.current} of {progress.total}
                </span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.03em", color: "#111827" }}>
                {question.scenario}
              </div>
            </div>

            <div style={{
              display: "flex", gap: 8, alignItems: "center",
            }}>
              {Array.from({ length: progress.total }).map((_, i) => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: i < progress.current ? "#7B2D8E" : "rgba(17,24,39,0.12)",
                  transition: "background 0.2s",
                }} />
              ))}
            </div>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.08fr) minmax(360px, 0.92fr)",
          gap: 14, alignItems: "start",
        }}>
          <div style={{
            ...surface, borderRadius: 30, padding: 16,
            display: "flex", flexDirection: "column", gap: 14,
          }}>
            {question.investigation_context && (
              <div style={{
                borderRadius: 22, padding: 14,
                background: "rgba(123,45,142,0.05)", border: "1px solid rgba(123,45,142,0.12)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7B2D8E", marginBottom: 8 }}>
                  Investigation Goal
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.55, color: "#111827" }}>
                  {question.investigation_context.goal}
                </div>
                {question.investigation_context.analyst_focus && question.investigation_context.analyst_focus.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7B2D8E", marginBottom: 6 }}>
                      Analyst Focus
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {question.investigation_context.analyst_focus.map((item, i) => (
                        <span key={i} style={{
                          padding: "3px 10px", borderRadius: 999,
                          background: "rgba(123,45,142,0.08)",
                          border: "1px solid rgba(123,45,142,0.16)",
                          color: "#7B2D8E", fontSize: 12, fontWeight: 600,
                        }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {question.investigation_context.expected_outcome && question.investigation_context.expected_outcome.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7B2D8E", marginBottom: 6 }}>
                      Expected Outcomes
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {question.investigation_context.expected_outcome.map((item, i) => (
                        <span key={i} style={{
                          padding: "3px 10px", borderRadius: 999,
                          background: "rgba(52,199,89,0.08)",
                          border: "1px solid rgba(52,199,89,0.16)",
                          color: "#34C759", fontSize: 12, fontWeight: 600,
                        }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div style={sectionLabel}>Evidence</div>

            {question.evidence.email && (
              <div style={{
                borderRadius: 22, padding: 14,
                background: "rgba(249,250,252,0.88)", border: "1px solid rgba(13,26,51,0.06)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0A84FF", marginBottom: 8 }}>
                  Email
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {Object.entries(question.evidence.email).map(([key, val]) =>
                    val && (
                      <div key={key} style={{ display: "flex", gap: 8, fontSize: 13 }}>
                        <span style={{ fontWeight: 700, color: "rgba(17,24,39,0.50)", whiteSpace: "nowrap", minWidth: 80 }}>
                          {key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
                        </span>
                        <span style={{ color: "#111827", wordBreak: "break-all", fontFamily: 'ui-monospace, "SF Mono", monospace', fontSize: 12 }}>
                          {val}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {question.evidence.proxy && (
              <div style={{
                borderRadius: 22, padding: 14,
                background: "rgba(249,250,252,0.88)", border: "1px solid rgba(13,26,51,0.06)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#FF9500", marginBottom: 8 }}>
                  Proxy
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {Object.entries(question.evidence.proxy).map(([key, val]) =>
                    val !== null && val !== undefined && (
                      <div key={key} style={{ display: "flex", gap: 8, fontSize: 13 }}>
                        <span style={{ fontWeight: 700, color: "rgba(17,24,39,0.50)", whiteSpace: "nowrap", minWidth: 80 }}>
                          {key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
                        </span>
                        <span style={{ color: "#111827", fontFamily: 'ui-monospace, "SF Mono", monospace', fontSize: 12 }}>
                          {String(val)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {question.evidence.edr && (
              <div style={{
                borderRadius: 22, padding: 14,
                background: "rgba(249,250,252,0.88)", border: "1px solid rgba(13,26,51,0.06)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#FF3B30", marginBottom: 8 }}>
                  EDR
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {Object.entries(question.evidence.edr).map(([key, val]) =>
                    val && (
                      <div key={key} style={{ display: "flex", gap: 8, fontSize: 13 }}>
                        <span style={{ fontWeight: 700, color: "rgba(17,24,39,0.50)", whiteSpace: "nowrap", minWidth: 80 }}>
                          {key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
                        </span>
                        <span style={{ color: "#111827", fontFamily: 'ui-monospace, "SF Mono", monospace', fontSize: 12 }}>
                          {val}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{
            ...surface, borderRadius: 28, padding: 18,
            display: "grid", gap: 16, alignContent: "start",
            maxHeight: "calc(100dvh - 140px)", overflow: "auto",
          }}>
            {hasClassification && (
              <div style={{ display: "grid", gap: 8 }}>
                <div style={sectionLabel}>Primary classification</div>
                <div style={{ display: "grid", gap: 6 }}>
                  {primaryOptions.map(opt => (
                    <motion.button
                      key={opt}
                      onClick={() => onSetPrimary(opt)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        width: "100%", padding: "10px 14px", borderRadius: 14,
                        textAlign: "left", fontSize: 13, fontWeight: 600,
                        border: answer.primary === opt
                          ? "1.5px solid #7B2D8E"
                          : "1px solid rgba(13,26,51,0.10)",
                        background: answer.primary === opt
                          ? "linear-gradient(180deg, #7B2D8E0D 0%, rgba(255,255,255,0.94) 100%)"
                          : "rgba(249,250,252,0.88)",
                        color: "#111827",
                        cursor: "pointer",
                      }}
                    >
                      {opt}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {hasClassification && answer.primary && (
              <div style={{ display: "grid", gap: 8 }}>
                <div style={sectionLabel}>Secondary diagnosis</div>
                <div style={{ fontSize: 11, color: "rgba(17,24,39,0.50)", marginBottom: 4 }}>
                  {Array.isArray(question.classification.correct.secondary)
                    ? "Select all that apply"
                    : "Choose one"}
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {secondaryOptions.map(opt => {
                    const isSelected = Array.isArray(answer.secondary)
                      ? answer.secondary.includes(opt)
                      : answer.secondary === opt;
                    return (
                      <motion.button
                        key={opt}
                        onClick={() => onSetSecondary(opt)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        style={{
                          width: "100%", padding: "10px 14px", borderRadius: 14,
                          textAlign: "left", fontSize: 13, fontWeight: 600,
                          border: isSelected
                            ? "1.5px solid #7B2D8E"
                            : "1px solid rgba(13,26,51,0.10)",
                          background: isSelected
                            ? "linear-gradient(180deg, #7B2D8E0D 0%, rgba(255,255,255,0.94) 100%)"
                            : "rgba(249,250,252,0.88)",
                          color: "#111827",
                          cursor: "pointer",
                        }}
                      >
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {question.task_prompt && (
              <div style={{
                padding: "10px 14px", borderRadius: 14,
                background: "rgba(123,45,142,0.06)", border: "1px solid rgba(123,45,142,0.12)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7B2D8E", marginBottom: 4 }}>
                  SPL Task
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "rgba(17,24,39,0.75)", fontWeight: 500 }}>
                  {question.task_prompt}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gap: 8 }}>
              <div style={sectionLabel}>SPL query</div>
              <textarea
                value={answer.splText}
                onChange={e => onSetSplText(e.target.value)}
                placeholder="index=email ... | stats count by sender"
                rows={5}
                style={{
                  width: "100%", padding: 12, borderRadius: 14,
                  fontSize: 13, fontFamily: 'ui-monospace, "SF Mono", monospace',
                  border: "1px solid rgba(13,26,51,0.12)",
                  background: "rgba(249,250,252,0.88)",
                  color: "#111827", resize: "vertical",
                  lineHeight: 1.5,
                }}
              />
            </div>

            <motion.button
              onClick={onSubmit}
              disabled={!canSubmit}
              whileHover={canSubmit ? { scale: 1.015 } : {}}
              whileTap={canSubmit ? { scale: 0.985 } : {}}
              style={{
                width: "100%", padding: "14px 18px", borderRadius: 18, fontSize: 15, fontWeight: 700, letterSpacing: "0.01em",
                border: canSubmit ? "1px solid rgba(255,255,255,0.45)" : "1px solid rgba(17,24,39,0.10)",
                background: canSubmit
                  ? "linear-gradient(135deg, #7B2D8E 0%, #5A1D6E 100%)"
                  : "rgba(17,24,39,0.06)",
                color: canSubmit ? "#fff" : "rgba(17,24,39,0.50)",
                boxShadow: canSubmit ? "0 18px 30px rgba(123,45,142,0.24)" : "none",
                cursor: canSubmit ? "pointer" : "default",
              }}
            >
              Submit
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

SocRound.propTypes = {
  question: PropTypes.shape({
    scenario: PropTypes.string.isRequired,
    evidence: PropTypes.shape({
      email: PropTypes.object,
      proxy: PropTypes.object,
      edr: PropTypes.object,
    }).isRequired,
    classification: PropTypes.shape({
      options: PropTypes.shape({
        primary: PropTypes.arrayOf(PropTypes.string).isRequired,
        secondary: PropTypes.arrayOf(PropTypes.string).isRequired,
      }),
      correct: PropTypes.shape({
        secondary: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.arrayOf(PropTypes.string),
        ]),
      }),
    }),
    investigation_context: PropTypes.shape({
      goal: PropTypes.string,
      analyst_focus: PropTypes.arrayOf(PropTypes.string),
      expected_outcome: PropTypes.arrayOf(PropTypes.string),
    }),
    task_prompt: PropTypes.string,
  }).isRequired,
  answer: PropTypes.shape({
    primary: PropTypes.string,
    secondary: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.arrayOf(PropTypes.string),
    ]),
    splText: PropTypes.string,
    submitted: PropTypes.bool,
  }).isRequired,
  progress: PropTypes.shape({
    current: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
  onSetPrimary: PropTypes.func.isRequired,
  onSetSecondary: PropTypes.func.isRequired,
  onSetSplText: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onViolation: PropTypes.func,
};

SocRound.defaultProps = {
  onViolation: null,
};
