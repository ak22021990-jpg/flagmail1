import { useState } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import { glass } from "../styles/tokens.js";
import { useAdmin } from "../hooks/useAdmin.js";
import CandidateList from "./CandidateList.jsx";

const localGlass = { ...glass, backdropFilter: "blur(30px) saturate(165%)", WebkitBackdropFilter: "blur(30px) saturate(165%)", border: "1px solid rgba(255,255,255,0.84)" };

const panelHeader = {
  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
  padding: "14px 18px", cursor: "pointer", userSelect: "none",
  fontSize: 14, fontWeight: 700, color: "#111827",
};

const badge = (count) => ({
  padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
  background: "rgba(17,24,39,0.06)", color: "rgba(17,24,39,0.54)",
});

const cellTd = { padding: "8px 12px", fontSize: 13, color: "#111827", borderBottom: "1px solid rgba(13,26,51,0.05)" };
const cellTh = { ...cellTd, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(17,24,39,0.48)" };

function gradeColor(grade) {
  const g = (grade || "").toLowerCase();
  if (g === "strong") return { bg: "rgba(52,199,89,0.12)", color: "#34C759" };
  if (g === "good") return { bg: "rgba(10,132,255,0.12)", color: "#0A84FF" };
  if (g === "needs improvement") return { bg: "rgba(255,149,0,0.12)", color: "#FF9500" };
  return { bg: "rgba(255,59,48,0.10)", color: "#FF3B30" };
}

function CollapsiblePanel({ title, count, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ ...localGlass, borderRadius: 22, overflow: "hidden" }}>
      <div style={panelHeader} onClick={() => setOpen(!open)}>
        <span>{open ? "\u25BC" : "\u25B6"} {title}</span>
        <span style={badge()}>{count}</span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 18px 18px" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminPanel({ onBack }) {
  const { data, loading, error, authenticated, fetchAdminData, refresh, reset } = useAdmin();
  const [passcode, setPasscode] = useState("");

  function handleLogin() {
    if (!passcode.trim()) return;
    fetchAdminData(passcode);
  }

  function handleBack() {
    reset();
    onBack();
  }

  if (!authenticated) {
    return (
      <div style={{
        minHeight: "100dvh", padding: "clamp(18px, 3vw, 30px)",
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ ...localGlass, borderRadius: 24, padding: 28, display: "grid", gap: 16, maxWidth: 400, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.04em", color: "#111827" }}>
              Admin Panel
            </h1>
            <motion.button
              onClick={onBack}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                padding: "8px 14px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                border: "1px solid rgba(13,26,51,0.10)", background: "rgba(249,250,252,0.88)",
                color: "#111827", cursor: "pointer",
              }}
            >
              Back
            </motion.button>
          </div>
          <div style={{ fontSize: 13, color: "rgba(17,24,39,0.54)" }}>
            Enter the admin passcode to access all candidate submissions.
          </div>
          <input
            type="password"
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            placeholder="Passcode"
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 14, fontSize: 14,
              border: "1px solid rgba(13,26,51,0.12)",
              background: "rgba(249,250,252,0.88)", color: "#111827",
            }}
          />
          {error && <div style={{ fontSize: 13, color: "#FF3B30" }}>{error}</div>}
          <motion.button
            onClick={handleLogin}
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{
              padding: "12px 18px", borderRadius: 14, fontSize: 14, fontWeight: 700,
              border: "1px solid rgba(10,132,255,0.24)",
              background: "linear-gradient(135deg, #0A84FF 0%, #0066CC 100%)",
              color: "#fff", cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1,
              width: "100%",
            }}
          >
            {loading ? "Authenticating..." : "Access Admin Panel"}
          </motion.button>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        fontSize: 15, color: "rgba(17,24,39,0.54)",
      }}>
        Loading admin data...
      </div>
    );
  }

  const candidates = data?.candidates || [];
  const rawData = data?.rawData || [];
  const socData = data?.socData || [];

  return (
    <div style={{
      minHeight: "100dvh", padding: "clamp(18px, 3vw, 30px)",
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "space-between" }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em", color: "#111827" }}>
            Admin Panel
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <motion.button
              onClick={refresh}
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                padding: "10px 18px", borderRadius: 14, fontSize: 13, fontWeight: 600,
                border: "1px solid rgba(13,26,51,0.12)", background: "rgba(249,250,252,0.88)",
                color: "#111827", cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </motion.button>
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
              Back
            </motion.button>
          </div>
        </div>

        {error && (
          <div style={{ ...localGlass, borderRadius: 16, padding: "14px 20px", fontSize: 13, color: "#FF3B30" }}>
            {error}
          </div>
        )}

        <CollapsiblePanel title="Candidates" count={candidates.length} defaultOpen={true}>
          <CandidateList candidates={candidates} />
        </CollapsiblePanel>

        <CollapsiblePanel title="Raw Classifications" count={rawData.length} defaultOpen={false}>
          {rawData.length === 0 ? (
            <div style={{ fontSize: 13, color: "rgba(17,24,39,0.46)", padding: "12px 0" }}>No classification data yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    <th style={cellTh}>Name</th>
                    <th style={cellTh}>Email</th>
                    <th style={cellTh}>Email ID</th>
                    <th style={cellTh}>L1 Pick</th>
                    <th style={cellTh}>L2 Pick</th>
                    <th style={cellTh}>Correct L1</th>
                    <th style={cellTh}>Correct L2</th>
                    <th style={cellTh}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {rawData.map((row, i) => (
                    <tr key={i}>
                      <td style={cellTd}>{row[0] || "-"}</td>
                      <td style={cellTd}>{row[1] || "-"}</td>
                      <td style={cellTd}>{row[2] || "-"}</td>
                      <td style={cellTd}>{row[3] || "-"}</td>
                      <td style={cellTd}>{row[4] || "-"}</td>
                      <td style={cellTd}>{row[6] || "-"}</td>
                      <td style={cellTd}>{row[7] || "-"}</td>
                      <td style={cellTd}>{row[5] || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CollapsiblePanel>

        <CollapsiblePanel title="SOC Answers" count={socData.length} defaultOpen={false}>
          {socData.length === 0 ? (
            <div style={{ fontSize: 13, color: "rgba(17,24,39,0.46)", padding: "12px 0" }}>No SOC submissions yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left" }}>
                    <th style={cellTh}>Name</th>
                    <th style={cellTh}>Email</th>
                    <th style={cellTh}>Question</th>
                    <th style={cellTh}>Primary</th>
                    <th style={cellTh}>Score</th>
                    <th style={cellTh}>Grade</th>
                    <th style={cellTh}>SPL Query</th>
                  </tr>
                </thead>
                <tbody>
                  {socData.map((row, i) => (
                    <tr key={i}>
                      <td style={cellTd}>{row[0] || "-"}</td>
                      <td style={cellTd}>{row[1] || "-"}</td>
                      <td style={cellTd}>{row[2] || "-"}</td>
                      <td style={cellTd}>{row[3] || "-"}</td>
                      <td style={cellTd}>{row[4] || row.score || "-"}</td>
                      <td style={cellTd}>
                        <span style={{ padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700, ...gradeColor(row[5] || row.grade) }}>
                          {row[5] || row.grade || "-"}
                        </span>
                      </td>
                      <td style={{ ...cellTd, maxWidth: 280 }}>
                        <pre style={{ margin: 0, fontSize: 11, fontFamily: 'ui-monospace, "SF Mono", monospace', whiteSpace: "pre-wrap", color: "rgba(17,24,39,0.72)" }}>
                          {row[6] || row.splText || "-"}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CollapsiblePanel>
      </div>
    </div>
  );
}

AdminPanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};
