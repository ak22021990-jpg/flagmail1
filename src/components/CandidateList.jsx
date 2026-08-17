import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";

const TIER_FILTERS = [
  { value: "all", label: "All" },
  { value: "advanced", label: "Advanced" },
  { value: "proficient", label: "Proficient" },
  { value: "foundation", label: "Foundation" },
];

const PROCTOR_FILTERS = [
  { value: "flagged", label: "Flagged" },
  { value: "clean", label: "Clean" },
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
  if (isNaN(n)) return "foundation";
  if (n >= 80) return "advanced";
  if (n >= 50) return "proficient";
  return "foundation";
}

function buildViolationSummary(logs) {
  if (!logs || logs.length === 0) return null;
  const counts = {};
  logs.forEach(l => { counts[l.logType] = (counts[l.logType] || 0) + 1; });
  return Object.entries(counts).map(([t, n]) => `${t}×${n}`).join(', ');
}

export default function CandidateList({ candidates, onSelectCandidate, verdictBand, violationsByEmail }) {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [proctorFilter, setProctorFilter] = useState("all");
  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  const filtered = useMemo(() => {
    let list = candidates;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => safeName(c).toLowerCase().includes(q) || safeEmail(c).toLowerCase().includes(q));
    }
    if (tierFilter !== "all") {
      list = list.filter(c => verdictKey(safeScore(c)) === tierFilter);
    }
    if (proctorFilter === "flagged") {
      list = list.filter(c => safeTabSwitches(c) > 0);
    } else if (proctorFilter === "clean") {
      list = list.filter(c => safeTabSwitches(c) === 0);
    }
    return [...list].sort((a, b) => {
      if (sortField === "date") {
        const da = safeDate(a);
        const db = safeDate(b);
        const ta = da !== "—" ? new Date(da).getTime() || 0 : 0;
        const tb = db !== "—" ? new Date(db).getTime() || 0 : 0;
        return sortDir === "desc" ? tb - ta : ta - tb;
      }
      const diff = (safeScore(a) ?? 0) - (safeScore(b) ?? 0);
      return sortDir === "desc" ? -diff : diff;
    });
  }, [candidates, search, tierFilter, proctorFilter, sortField, sortDir]);

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
          {TIER_FILTERS.map(f => {
            const active = tierFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setTierFilter(tierFilter === f.value && f.value !== "all" ? "all" : f.value)}
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

          <div style={{ width: 1, height: 18, background: "rgba(13,26,51,0.10)", margin: "0 4px" }} />

          {PROCTOR_FILTERS.map(f => {
            const active = proctorFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setProctorFilter(proctorFilter === f.value ? "all" : f.value)}
                style={{
                  padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: active ? 600 : 400,
                  border: active ? "0.5px solid #E65100" : "0.5px solid rgba(13,26,51,0.10)",
                  background: active ? "#FFF3E0" : "rgba(249,250,252,0.88)",
                  color: active ? "#E65100" : "rgba(17,24,39,0.54)",
                  cursor: "pointer", transition: "all 0.12s",
                }}
              >
                {f.label}
              </button>
            );
          })}

          <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button
              onClick={() => setSortField(f => f === "date" ? "score" : "date")}
              style={{
                padding: "5px 13px", borderRadius: 20, fontSize: 12,
                border: "0.5px solid rgba(13,26,51,0.10)",
                background: "rgba(249,250,252,0.88)",
                color: "rgba(17,24,39,0.54)", cursor: "pointer",
              }}
            >
              Sort: {sortField === "date" ? "Date" : "Score"}
            </button>
            <button
              onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
              style={{
                padding: "5px 13px", borderRadius: 20, fontSize: 12,
                border: "0.5px solid rgba(13,26,51,0.10)",
                background: "rgba(249,250,252,0.88)",
                color: "rgba(17,24,39,0.54)", cursor: "pointer",
              }}
            >
              {sortDir === "desc" ? "▼" : "▲"}
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
            const email = safeEmail(c);
            const integrityLogs = (violationsByEmail && violationsByEmail[email]) || [];
            const integrityCount = integrityLogs.length;
            const integritySummary = buildViolationSummary(integrityLogs);
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

                {/* Proctoring violations */}
                <div style={{
                  fontSize: 11, fontWeight: 600, flexShrink: 0, minWidth: 44, textAlign: "center",
                  padding: "3px 8px", borderRadius: 10,
                  color: sw > 0 ? "#E65100" : "rgba(17,24,39,0.36)",
                  background: sw > 0 ? "#FFF3E0" : "transparent",
                }}>
                  {sw > 0 ? `⚠ ${sw}` : "0"}
                </div>

                {/* Integrity violations */}
                {integrityCount > 0 && (
                  <div
                    title={integritySummary}
                    style={{
                      fontSize: 11, fontWeight: 600, flexShrink: 0, textAlign: "center",
                      padding: "3px 8px", borderRadius: 10,
                      color: "#791F1F", background: "#FCEBEB",
                    }}
                  >
                    🚩 {integrityCount}
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
  violationsByEmail: PropTypes.object,
};
