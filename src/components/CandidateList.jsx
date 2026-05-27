import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "pass", label: "Pass" },
  { value: "borderline", label: "Borderline" },
  { value: "fail", label: "Fail" },
];

function safeName(c) { return c.name || c[0] || c.candidateName || "—"; }
function safeEmail(c) { return c.email || c[1] || "—"; }
function safeScore(c) {
  const v = c.totalScore !== undefined ? c.totalScore : c[6] !== undefined ? c[6] : c.score;
  return v !== undefined ? Number(v) : null;
}
function safeDate(c) { return c.submissionDate || c[2] || c.date || c.timestamp || "—"; }
function safeTabSwitches(c) {
  const v = c.tabSwitches !== undefined ? c.tabSwitches : c[8] !== undefined ? c[8] : c.proctoring !== undefined ? c.proctoring : c.tabSwitchCount;
  return v !== undefined ? Number(v) : 0;
}

function verdictKey(score) {
  const n = Number(score);
  if (isNaN(n)) return "fail";
  if (n >= 80) return "pass";
  if (n >= 60) return "borderline";
  return "fail";
}

export default function CandidateList({ candidates, onSelectCandidate, verdictBand }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortDir, setSortDir] = useState("desc");

  const filtered = useMemo(() => {
    let list = candidates;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => safeName(c).toLowerCase().includes(q) || safeEmail(c).toLowerCase().includes(q));
    }
    if (filter !== "all") {
      list = list.filter(c => verdictKey(safeScore(c)) === filter);
    }
    return [...list].sort((a, b) => {
      const diff = (safeScore(a) ?? 0) - (safeScore(b) ?? 0);
      return sortDir === "desc" ? -diff : diff;
    });
  }, [candidates, search, filter, sortDir]);

  return (
    <div>
      {/* Search + filters */}
      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 12, fontSize: 13,
            border: "0.5px solid rgba(13,26,51,0.10)",
            background: "rgba(249,250,252,0.88)", color: "#111827",
            fontFamily: "inherit",
          }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {FILTERS.map(f => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(filter === f.value && f.value !== "all" ? "all" : f.value)}
                style={{
                  padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: active ? 600 : 400,
                  border: active ? "0.5px solid #185FA5" : "0.5px solid rgba(13,26,51,0.10)",
                  background: active ? "#E6F1FB" : "rgba(249,250,252,0.88)",
                  color: active ? "#0C447C" : "rgba(17,24,39,0.54)",
                  cursor: "pointer", transition: "all 0.12s",
                }}
              >
                {f.label}
              </button>
            );
          })}
          <span style={{ marginLeft: "auto" }}>
            <button
              onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
              style={{
                padding: "5px 13px", borderRadius: 20, fontSize: 12,
                border: "0.5px solid rgba(13,26,51,0.10)",
                background: "rgba(249,250,252,0.88)",
                color: "rgba(17,24,39,0.54)", cursor: "pointer",
              }}
            >
              Score {sortDir === "desc" ? "▼" : "▲"}
            </button>
          </span>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ fontSize: 13, color: "rgba(17,24,39,0.46)", padding: "16px 0", textAlign: "center" }}>
          {candidates.length === 0 ? "No submissions yet." : "No candidates match your search."}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {filtered.map((c, i) => {
            const score = safeScore(c);
            const v = verdictBand(score);
            const sw = safeTabSwitches(c);
            return (
              <motion.div
                key={i}
                onClick={() => onSelectCandidate && onSelectCandidate(c)}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.998 }}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 18px", borderRadius: 14,
                  background: "rgba(255,255,255,0.92)",
                  border: "0.5px solid rgba(13,26,51,0.08)",
                  cursor: onSelectCandidate ? "pointer" : "default",
                  transition: "box-shadow 0.12s",
                }}
              >
                {/* Verdict band indicator */}
                <div style={{
                  width: 4, height: 40, borderRadius: 2, flexShrink: 0,
                  background: v.color,
                }} />

                {/* Name + email */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {safeName(c)}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(17,24,39,0.48)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {safeEmail(c)}
                  </div>
                </div>

                {/* Date */}
                <div style={{ fontSize: 11, color: "rgba(17,24,39,0.40)", flexShrink: 0, textAlign: "right" }}>
                  {safeDate(c)}
                </div>

                {/* Proctoring flag */}
                {sw > 0 && (
                  <div style={{ fontSize: 11, color: "#791F1F", fontWeight: 700, flexShrink: 0 }}>
                    {"⚠"} {sw}
                  </div>
                )}

                {/* Score */}
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", flexShrink: 0, minWidth: 40, textAlign: "right" }}>
                  {score ?? "—"}
                </div>

                {/* Verdict pill */}
                <div style={{
                  padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: v.bg, color: v.color, border: `0.5px solid ${v.border}`,
                  flexShrink: 0, minWidth: 80, textAlign: "center",
                }}>
                  {v.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

CandidateList.propTypes = {
  candidates: PropTypes.array.isRequired,
  onSelectCandidate: PropTypes.func,
  verdictBand: PropTypes.func.isRequired,
};
