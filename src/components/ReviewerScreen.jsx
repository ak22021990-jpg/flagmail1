import { useState } from "react";
import { motion } from "framer-motion";
import { LEADERBOARD_URL } from "../config.js";

const glass = {
  background: "rgba(255,255,255,0.74)",
  backdropFilter: "blur(30px) saturate(165%)",
  WebkitBackdropFilter: "blur(30px) saturate(165%)",
  border: "1px solid rgba(255,255,255,0.84)",
  boxShadow: "0 24px 80px rgba(32, 52, 89, 0.11), 0 8px 24px rgba(32, 52, 89, 0.06)",
};

export default function ReviewerScreen({ onBack }) {
  const [passcode, setPasscode] = useState("");
  const [submissions, setSubmissions] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  async function handleSubmit() {
    if (!passcode.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(LEADERBOARD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getSOCSubmissions", passcode }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Invalid passcode");
      } else {
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      setError("Failed to fetch submissions");
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100dvh", padding: "clamp(18px, 3vw, 30px)",
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "space-between" }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em", color: "#111827" }}>
            SOC Reviewer
          </h1>
          <motion.button
            onClick={onBack}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{
              padding: "10px 18px", borderRadius: 14, fontSize: 13, fontWeight: 600,
              border: "1px solid rgba(13,26,51,0.10)", background: "rgba(249,250,252,0.88)",
              color: "#111827", cursor: "pointer",
            }}
          >
            Back to game
          </motion.button>
        </div>

        {!submissions && (
          <div style={{ ...glass, borderRadius: 24, padding: 24, display: "grid", gap: 16, maxWidth: 400 }}>
            <div style={{ fontSize: 13, color: "rgba(17,24,39,0.58)" }}>
              Enter the reviewer passcode to access SOC submissions.
            </div>
            <input
              type="password"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              placeholder="Passcode"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 14, fontSize: 14,
                border: "1px solid rgba(13,26,51,0.12)",
                background: "rgba(249,250,252,0.88)", color: "#111827",
              }}
            />
            {error && <div style={{ fontSize: 13, color: "#FF3B30" }}>{error}</div>}
            <motion.button
              onClick={handleSubmit}
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                padding: "12px 18px", borderRadius: 14, fontSize: 14, fontWeight: 700,
                border: "1px solid rgba(10,132,255,0.24)",
                background: "linear-gradient(135deg, #0A84FF 0%, #0066CC 100%)",
                color: "#fff", cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Loading..." : "View submissions"}
            </motion.button>
          </div>
        )}

        {submissions && submissions.length === 0 && (
          <div style={{ ...glass, borderRadius: 24, padding: 24, textAlign: "center", fontSize: 14, color: "rgba(17,24,39,0.54)" }}>
            No SOC submissions yet.
          </div>
        )}

        {submissions && submissions.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            {submissions.map((sub, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{ ...glass, borderRadius: 22, padding: 16, display: "grid", gap: 10 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div style={{ display: "grid", gap: 2 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{sub.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(17,24,39,0.46)" }}>
                      {sub.email} — {new Date(sub.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {sub.questions.map((q, qi) => (
                      <span key={qi} style={{
                        padding: "4px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                        background: q.score >= 20 ? "rgba(52,199,89,0.12)" : q.score >= 15 ? "rgba(10,132,255,0.12)" : "rgba(255,59,48,0.10)",
                        color: q.score >= 20 ? "#34C759" : q.score >= 15 ? "#0A84FF" : "#FF3B30",
                      }}>
                        {q.grade}
                      </span>
                    ))}
                  </div>
                </div>

                <motion.button
                  onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                  whileHover={{ scale: 1.005 }}
                  style={{
                    alignSelf: "start", padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                    border: "1px solid rgba(13,26,51,0.08)", background: "rgba(249,250,252,0.88)",
                    color: "rgba(17,24,39,0.58)", cursor: "pointer",
                  }}
                >
                  {expandedRow === i ? "Hide details" : "Show details"}
                </motion.button>

                {expandedRow === i && (
                  <div style={{ display: "grid", gap: 10, paddingTop: 8, borderTop: "1px solid rgba(13,26,51,0.06)" }}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(17,24,39,0.48)" }}>
                        SPL Query
                      </div>
                      <pre style={{
                        margin: 0, padding: 12, borderRadius: 12, fontSize: 12, lineHeight: 1.5,
                        fontFamily: 'ui-monospace, "SF Mono", monospace',
                        background: "rgba(17,24,39,0.04)", color: "#111827", whiteSpace: "pre-wrap", overflow: "auto",
                      }}>
                        {sub.splText || "(empty)"}
                      </pre>
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(17,24,39,0.48)" }}>
                        Explanation
                      </div>
                      <div style={{
                        padding: 12, borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                        background: "rgba(249,250,252,0.88)", color: "#111827",
                      }}>
                        {sub.explanation || "(empty)"}
                      </div>
                    </div>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(17,24,39,0.48)" }}>
                        Per-question scores
                      </div>
                      <div style={{ display: "grid", gap: 4 }}>
                        {sub.questions.map((q, qi) => (
                          <div key={qi} style={{
                            display: "flex", justifyContent: "space-between", gap: 10,
                            padding: "6px 10px", borderRadius: 8,
                            background: qi % 2 === 0 ? "rgba(249,250,252,0.88)" : "transparent",
                            fontSize: 13,
                          }}>
                            <span style={{ fontWeight: 600, color: "#111827" }}>{q.questionId}</span>
                            <span style={{ color: "rgba(17,24,39,0.58)" }}>{q.score}/23 — {q.grade}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
