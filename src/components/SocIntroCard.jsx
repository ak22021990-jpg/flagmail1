import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { glass } from "../styles/tokens.js";

// SocIntroCard uses stronger blur
const localGlass = { ...glass, backdropFilter: "blur(30px) saturate(165%)", WebkitBackdropFilter: "blur(30px) saturate(165%)", border: "1px solid rgba(255,255,255,0.84)" };

const accent = "#7B2D8E";
const endColor = "#5A1D6E";

export default function SocIntroCard({ onStart }) {
  return (
    <div style={{
      minHeight: "100dvh",
      padding: "clamp(18px, 3vw, 30px)",
      fontFamily: 'system-ui, sans-serif',
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: [
          `radial-gradient(circle at 14% 18%, ${accent}18, transparent 24%)`,
          "radial-gradient(circle at 85% 14%, rgba(255,255,255,0.65), transparent 20%)",
          "radial-gradient(circle at 50% 82%, rgba(17,24,39,0.06), transparent 28%)",
        ].join(","),
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
        style={{
          width: "100%", maxWidth: 1240, margin: "0 auto",
          display: "grid", gridTemplateColumns: "minmax(0, 1.12fr) minmax(360px, 0.88fr)",
          gap: 20, alignItems: "stretch", position: "relative",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          style={{
            ...localGlass, borderRadius: 34, padding: "clamp(24px, 3vw, 34px)",
            display: "grid", gap: 24, minWidth: 0,
          }}
        >
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "8px 14px", borderRadius: 999,
              background: `${accent}12`, border: `1px solid ${accent}24`, justifySelf: "start",
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: accent, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Zone 4
              </span>
              <span style={{ width: 1, height: 14, background: `${accent}35` }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(17,24,39,0.56)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                SOC Investigation
              </span>
            </div>

            <div style={{ display: "grid", gap: 12, maxWidth: 660 }}>
              <h1 style={{
                margin: 0, fontSize: "clamp(44px, 6vw, 80px)", lineHeight: 0.92,
                letterSpacing: "-0.06em", color: "#111827", fontWeight: 700,
              }}>
                SOC Desk
              </h1>
              <p style={{
                margin: 0, fontSize: "clamp(16px, 1.75vw, 19px)", lineHeight: 1.55,
                color: "rgba(17,24,39,0.66)", maxWidth: 560,
              }}>
                Classify the threat, write a Splunk SPL query, and explain your reasoning against real log evidence.
              </p>
            </div>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12,
          }}>
            {[
              { label: "Questions", value: "6", helper: "5 scenarios" },
              { label: "Max points", value: "112", helper: "SOC zone" },
              { label: "Grading", value: "Auto", helper: "Keyword match" },
            ].map(stat => (
              <div key={stat.label} style={{
                borderRadius: 22, padding: "16px 16px 15px",
                background: "rgba(255,255,255,0.82)", border: "1px solid rgba(13,26,51,0.06)",
                display: "grid", gap: 6,
              }}>
                <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontSize: 30, lineHeight: 1, fontWeight: 700, letterSpacing: "-0.05em", color: "#111827" }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {stat.helper}
                  </div>
                </div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.10em", fontWeight: 700, color: "rgba(17,24,39,0.50)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(17,24,39,0.50)" }}>
              What you will do
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
              {[
                { title: "Classify", detail: "Select a primary threat type and secondary diagnosis for each incident." },
                { title: "Write SPL", detail: "Author Splunk queries to find evidence in email, proxy, and EDR logs." },
                { title: "Explain", detail: "Describe your reasoning and link findings to the attack chain." },
              ].map(item => (
                <div key={item.title} style={{
                  display: "flex", alignItems: "flex-start", gap: 12,
                  borderRadius: 20, padding: "14px 16px",
                  background: "rgba(255,255,255,0.8)", border: "1px solid rgba(13,26,51,0.06)",
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", background: accent,
                    opacity: 0.7, marginTop: 6, flexShrink: 0,
                  }} />
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontSize: 16, lineHeight: 1.35, fontWeight: 700, letterSpacing: "-0.02em", color: "#111827" }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.55, color: "rgba(17,24,39,0.62)" }}>
                      {item.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, type: "spring", stiffness: 190, damping: 24 }}
          style={{
            ...localGlass, borderRadius: 32, padding: "clamp(24px, 3vw, 30px)",
            display: "grid", gap: 18, alignContent: "start", minHeight: "100%",
          }}
        >
          <div style={{
            borderRadius: 26, padding: "18px",
            background: `linear-gradient(180deg, ${accent}14 0%, rgba(255,255,255,0.88) 100%)`,
            border: `1px solid ${accent}22`, display: "grid", gap: 12,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "48px minmax(0, 1fr)", gap: 12, alignItems: "center" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: `${accent}14`, border: `1px solid ${accent}30`,
                display: "grid", placeItems: "center",
                fontSize: 20, fontWeight: 800, color: accent, letterSpacing: "-0.04em",
              }}>
                4
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(17,24,39,0.48)" }}>
                  Assessment mode
                </div>
                <div style={{ fontSize: 20, lineHeight: 1.05, letterSpacing: "-0.04em", fontWeight: 700, color: "#111827" }}>
                  No timer, no clues.
                </div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "rgba(17,24,39,0.66)" }}>
              Each question presents a security incident. Analyse the evidence, classify the threat, write an SPL query, and explain your reasoning. Your responses are scored automatically and reviewed later.
            </p>
          </div>

          <div style={{
            borderRadius: 24, padding: "16px",
            background: "rgba(255,255,255,0.82)", border: "1px solid rgba(13,26,51,0.06)",
            display: "grid", gap: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(17,24,39,0.48)" }}>
              Scoring breakdown
            </div>
            {[
              { dim: "Primary classification", pts: "5 pts" },
              { dim: "Secondary diagnosis", pts: "3 pts" },
              { dim: "SPL query", pts: "10 pts" },
              { dim: "Explanation", pts: "5 pts" },
              { dim: "Total per question", pts: "23 pts" },
            ].map((row, i) => (
              <div key={row.dim} style={{
                display: "flex", justifyContent: "space-between", gap: 10,
                padding: "6px 0", borderTop: i === 0 ? "none" : "1px solid rgba(13,26,51,0.06)",
                fontSize: i === 4 ? 13 : 12, fontWeight: i === 4 ? 700 : 600, color: i === 4 ? "#111827" : "rgba(17,24,39,0.58)",
              }}>
                <span>{row.dim}</span>
                <span>{row.pts}</span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: "auto", borderRadius: 22, padding: "14px 16px",
            background: "rgba(249,250,252,0.82)", border: "1px solid rgba(13,26,51,0.06)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(17,24,39,0.48)" }}>
              No time pressure
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: "rgba(17,24,39,0.64)" }}>
              Take your time. Focus on accuracy — each question is scored independently.
            </div>
          </div>

          <motion.button
            onClick={onStart}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            style={{
              width: "100%", padding: "16px 18px", borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.5)",
              background: `linear-gradient(135deg, ${accent} 0%, ${endColor} 100%)`,
              boxShadow: `0 18px 32px ${accent}2E`,
              color: "#fff", fontSize: 15, fontWeight: 700, letterSpacing: "0.01em",
            }}
          >
            Start SOC Investigation
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}

SocIntroCard.propTypes = {
  onStart: PropTypes.func.isRequired,
};
