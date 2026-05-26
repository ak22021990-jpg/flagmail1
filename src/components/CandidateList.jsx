import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";

const GRADE_ORDER = ["strong", "good", "needs improvement", "not ready"];

const GRADE_LABELS = ["All", "Strong", "Good", "Needs improvement", "Not ready"];

const GRADE_VALUES = ["all", "strong", "good", "needs improvement", "not ready"];

function gradeColor(grade) {
  const g = (grade || "").toLowerCase();
  if (g === "strong") return { bg: "rgba(52,199,89,0.12)", color: "#34C759" };
  if (g === "good") return { bg: "rgba(10,132,255,0.12)", color: "#0A84FF" };
  if (g === "needs improvement") return { bg: "rgba(255,149,0,0.12)", color: "#FF9500" };
  return { bg: "rgba(255,59,48,0.10)", color: "#FF3B30" };
}

const cellTh = {
  padding: "8px 12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.06em", color: "rgba(17,24,39,0.48)", borderBottom: "1px solid rgba(13,26,51,0.05)",
};

const cellTd = {
  padding: "8px 12px", fontSize: 13, color: "#111827", borderBottom: "1px solid rgba(13,26,51,0.05)",
};

const sortableTh = {
  ...cellTh, cursor: "pointer", userSelect: "none",
};

function safeName(c) { return c[0] || c.name || c.candidateName || "-"; }
function safeEmail(c) { return c[1] || c.email || "-"; }
function safeScore(c) { const v = c[6] !== undefined ? c[6] : c.totalScore !== undefined ? c.totalScore : c.score; return v !== undefined ? Number(v) : null; }
function safeGrade(c) { return (c[7] || c.grade || "").toLowerCase(); }
function safeDate(c) { return c[2] || c.date || c.timestamp || "-"; }
function safeTabSwitches(c) { const v = c[8] !== undefined ? c[8] : c.tabSwitches !== undefined ? c.tabSwitches : c.proctoring !== undefined ? c.proctoring : c.tabSwitchCount; return v !== undefined ? Number(v) : 0; }

function sortCandidates(list, sortKey, sortDir) {
  if (!sortKey) return list;
  const dir = sortDir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "score") {
      cmp = (safeScore(a) ?? 0) - (safeScore(b) ?? 0);
    } else if (sortKey === "grade") {
      cmp = GRADE_ORDER.indexOf(safeGrade(a)) - GRADE_ORDER.indexOf(safeGrade(b));
      if (cmp === 0) cmp = (safeScore(a) ?? 0) - (safeScore(b) ?? 0);
    } else if (sortKey === "date") {
      cmp = String(safeDate(a)).localeCompare(String(safeDate(b)));
    }
    return cmp * dir;
  });
}

export default function CandidateList({ candidates, onSelectCandidate }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  const [gradeFilter, setGradeFilter] = useState("all");

  const filtered = useMemo(() => {
    let list = candidates;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => safeName(c).toLowerCase().includes(q) || safeEmail(c).toLowerCase().includes(q));
    }
    if (gradeFilter !== "all") {
      list = list.filter(c => safeGrade(c) === gradeFilter);
    }
    return sortCandidates(list, sortKey, sortDir);
  }, [candidates, search, gradeFilter, sortKey, sortDir]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function sortArrow(key) {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? " \u25B2" : " \u25BC";
  }

  return (
    <div>
      <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search candidates..."
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 12, fontSize: 13,
            border: "1px solid rgba(13,26,51,0.10)",
            background: "rgba(249,250,252,0.88)", color: "#111827",
            fontFamily: 'inherit',
          }}
        />

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {GRADE_VALUES.map((val, idx) => {
            const active = gradeFilter === val;
            return (
              <motion.button
                key={val}
                onClick={() => setGradeFilter(gradeFilter === val ? "all" : val)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: "6px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  border: active ? "1px solid transparent" : "1px solid rgba(13,26,51,0.10)",
                  background: active ? "rgba(10,132,255,0.12)" : "rgba(249,250,252,0.88)",
                  color: active ? "#0A84FF" : "rgba(17,24,39,0.54)",
                  cursor: "pointer",
                }}
              >
                {GRADE_LABELS[idx]}
              </motion.button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ fontSize: 13, color: "rgba(17,24,39,0.46)", padding: "12px 0" }}>
          {candidates.length === 0 ? "No candidates yet." : "No candidates match your search or filter."}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={cellTh}>Name</th>
                <th style={cellTh}>Email</th>
                <th style={sortableTh} onClick={() => handleSort("score")}>
                  Score{sortArrow("score")}
                </th>
                <th style={sortableTh} onClick={() => handleSort("grade")}>
                  Grade{sortArrow("grade")}
                </th>
                <th style={sortableTh} onClick={() => handleSort("date")}>
                  Date{sortArrow("date")}
                </th>
                <th style={cellTh}>Proctoring</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const sw = safeTabSwitches(c);
                return (
                  <tr
                    key={i}
                    onClick={() => onSelectCandidate && onSelectCandidate(c)}
                    style={{ cursor: onSelectCandidate ? "pointer" : "default" }}
                    onMouseEnter={e => { if (onSelectCandidate) e.currentTarget.style.background = "rgba(10,132,255,0.04)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ""; }}
                  >
                    <td style={cellTd}>{safeName(c)}</td>
                    <td style={cellTd}>{safeEmail(c)}</td>
                    <td style={cellTd}>{safeScore(c) ?? "-"}</td>
                    <td style={cellTd}>
                      <span style={{ padding: "3px 8px", borderRadius: 8, fontSize: 11, fontWeight: 700, ...gradeColor(safeGrade(c)) }}>
                        {c[7] || c.grade || "-"}
                      </span>
                    </td>
                    <td style={cellTd}>{safeDate(c)}</td>
                    <td style={cellTd}>
                      {sw > 0 ? (
                        <span style={{ color: "#FF3B30", fontWeight: 700 }}>
                          {"\u26A0"} {sw}
                        </span>
                      ) : (
                        <span style={{ color: "rgba(17,24,39,0.30)" }}>{'\u2014'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

CandidateList.propTypes = {
  candidates: PropTypes.array.isRequired,
  onSelectCandidate: PropTypes.func,
};
