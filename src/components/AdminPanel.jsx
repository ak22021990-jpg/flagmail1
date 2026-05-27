import { useState } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { useAdmin } from "../hooks/useAdmin.js";
import CandidateList from "./CandidateList.jsx";
import AnswerSheet from "./AnswerSheet.jsx";
import { downloadCsv } from "../utils/exportCsv.js";

function verdictBand(score) {
  const n = Number(score);
  if (isNaN(n)) return { label: "—", bg: "rgba(17,24,39,0.04)", color: "rgba(17,24,39,0.40)", border: "rgba(17,24,39,0.08)" };
  if (n >= 80) return { label: "Advanced", bg: "#EAF3DE", color: "#27500A", border: "#C0DD97" };
  if (n >= 50) return { label: "Proficient", bg: "#FAEEDA", color: "#633806", border: "#FAC775" };
  return { label: "Foundation", bg: "#FCEBEB", color: "#791F1F", border: "#F7C1C1" };
}

const card = {
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(30px) saturate(165%)",
  WebkitBackdropFilter: "blur(30px) saturate(165%)",
  border: "1px solid rgba(255,255,255,0.84)",
  borderRadius: 22,
};

export default function AdminPanel({ onBack }) {
  const { data, loading, error, authenticated, fetchAdminData, refresh, reset } = useAdmin();
  const [passcode, setPasscode] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  function handleLogin() {
    if (!passcode.trim()) return;
    fetchAdminData(passcode);
  }

  if (!authenticated) {
    return (
      <div style={{
        minHeight: "100dvh", padding: "clamp(18px, 3vw, 30px)",
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ ...card, padding: 28, display: "grid", gap: 16, maxWidth: 400, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.04em", color: "#111827" }}>
              Reviewer Access
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
            Enter the reviewer passcode to access candidate submissions.
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
              border: "none",
              background: "#185FA5",
              color: "#E6F1FB", cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1,
              width: "100%",
            }}
          >
            {loading ? "Authenticating..." : "Access Reviewer Panel"}
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
        Loading submissions...
      </div>
    );
  }

  const candidates = data?.candidates || [];
  const rawData = data?.rawData || [];
  const socData = data?.socData || [];

  const advancedCount = candidates.filter(c => Number(c.totalScore ?? c[6] ?? 0) >= 80).length;
  const proficientCount = candidates.filter(c => {
    const s = Number(c.totalScore ?? c[6] ?? 0);
    return s >= 50 && s < 80;
  }).length;
  const foundationCount = candidates.length - advancedCount - proficientCount;
  const totalViolations = candidates.reduce((sum, c) => sum + Number(c.tabSwitches ?? c[8] ?? 0), 0);
  const flaggedCount = candidates.filter(c => Number(c.tabSwitches ?? c[8] ?? 0) > 0).length;

  function handleCsvDownload() {
    const rows = candidates.map((c) => {
      const score = Number(c.totalScore ?? c[6] ?? 0);
      const v = verdictBand(score);
      return {
        Name: c.name || c[0] || "",
        Email: c.email || c[1] || "",
        Score: score,
        Tier: v.label,
        "Tab Switches": c.tabSwitches ?? c[8] ?? 0,
        "Submission Date": c.submissionDate ?? c[2] ?? "",
      };
    });
    downloadCsv(rows, "flagmail-submissions.csv");
  }

  if (selectedCandidate) {
    return (
      <AnswerSheet
        candidate={selectedCandidate}
        rawData={rawData}
        socData={socData}
        onBack={() => setSelectedCandidate(null)}
      />
    );
  }

  return (
    <div style={{
      minHeight: "100dvh", padding: "clamp(18px, 3vw, 30px)",
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 16 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "space-between" }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.04em", color: "#111827" }}>
            Reviewer Panel
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <motion.button
              onClick={handleCsvDownload}
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                padding: "8px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                border: "0.5px solid rgba(13,26,51,0.12)", background: "rgba(249,250,252,0.88)",
                color: "#111827", cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1,
              }}
            >
              Export CSV
            </motion.button>
            <motion.button
              onClick={refresh}
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                padding: "8px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                border: "0.5px solid rgba(13,26,51,0.12)", background: "rgba(249,250,252,0.88)",
                color: "#111827", cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "..." : "Refresh"}
            </motion.button>
            <motion.button
              onClick={() => { reset(); onBack(); }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                padding: "8px 16px", borderRadius: 12, fontSize: 12, fontWeight: 600,
                border: "0.5px solid rgba(13,26,51,0.12)", background: "rgba(249,250,252,0.88)",
                color: "#111827", cursor: "pointer",
              }}
            >
              Exit
            </motion.button>
          </div>
        </div>

        {error && (
          <div style={{ ...card, borderRadius: 14, padding: "12px 16px", fontSize: 13, color: "#791F1F", background: "#FCEBEB", border: "0.5px solid #F7C1C1" }}>
            {error}
          </div>
        )}

        {/* Summary stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          <div style={{ ...card, borderRadius: 16, padding: "16px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#111827" }}>{candidates.length}</div>
            <div style={{ fontSize: 12, color: "rgba(17,24,39,0.48)", marginTop: 2 }}>Total</div>
          </div>
          <div style={{ borderRadius: 16, padding: "16px 18px", textAlign: "center", background: "#EAF3DE", border: "0.5px solid #C0DD97" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#27500A" }}>{advancedCount}</div>
            <div style={{ fontSize: 12, color: "#27500A", marginTop: 2 }}>Advanced</div>
          </div>
          <div style={{ borderRadius: 16, padding: "16px 18px", textAlign: "center", background: "#FAEEDA", border: "0.5px solid #FAC775" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#633806" }}>{proficientCount}</div>
            <div style={{ fontSize: 12, color: "#633806", marginTop: 2 }}>Proficient</div>
          </div>
          <div style={{ borderRadius: 16, padding: "16px 18px", textAlign: "center", background: "#FCEBEB", border: "0.5px solid #F7C1C1" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#791F1F" }}>{foundationCount}</div>
            <div style={{ fontSize: 12, color: "#791F1F", marginTop: 2 }}>Foundation</div>
          </div>
        </div>

        {/* Candidate list */}
        <CandidateList
          candidates={candidates}
          onSelectCandidate={setSelectedCandidate}
          verdictBand={verdictBand}
        />
      </div>
    </div>
  );
}

AdminPanel.propTypes = {
  onBack: PropTypes.func.isRequired,
};
