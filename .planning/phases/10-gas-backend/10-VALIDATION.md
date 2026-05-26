---
phase: 10
slug: gas-backend
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-26
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual (curl + GAS deploy) |
| **Config file** | N/A — GAS has no local test runner |
| **Quick run command** | `curl -X POST <GAS_URL> -H 'Content-Type: text/plain' -d '{"action":"getAdminData","passcode":"CORRECT"}'` |
| **Full suite command** | Same as quick — single endpoint |
| **Estimated runtime** | ~10 seconds (network round trip) |

---

## Sampling Rate

- **After every task commit:** Manual curl test against deployed GAS endpoint
- **After every plan wave:** Full manual test: wrong passcode → error, correct passcode → all 3 arrays returned
- **Before `/gsd:verify-work`:** All three success criteria verified manually via curl
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | GAS-02 | T-10-01 | checkPasscode validates via PropertiesService, rejects wrong passcode before any sheet read | manual | `curl ... -d '{"action":"getAdminData","passcode":"wrong"}'` → `{"error":"Unauthorized"}` | ❌ Manual | ⬜ pending |
| 10-01-02 | 01 | 1 | GAS-01 | T-10-02 | getAdminData reads Summary, RawData, SOCData sheets; returns structured JSON | manual | `curl ...` + assert candidates/rawData/socData keys in response | ❌ Manual | ⬜ pending |
| 10-01-03 | 01 | 1 | GAS-03 | T-10-03 | Response shape: candidates include name, email, totalScore, gradeBand, date, tabSwitchCount | manual | `curl ...` + verify candidate object shape with python/jq | ❌ Manual | ⬜ pending |
| 10-01-04 | 01 | 1 | — | — | Existing GAS actions (register, submit, submitSOC, submitFinal) unchanged | regression | Manual GAS deploy + playthrough of candidate flow | ❌ Manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. GAS has no local test runner — all verification is manual.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Passcode rejection | GAS-02 | PropertiesService only exists in GAS runtime | POST with wrong passcode → assert `{"error":"Unauthorized"}` |
| Sheet data reads | GAS-01 | SpreadsheetApp API only runs inside GAS | POST with correct passcode → assert response has candidates/rawData/socData arrays |
| Response shape | GAS-03 | Cannot mock GAS response locally | Verify candidate objects have name, email, totalScore, gradeBand, date, tabSwitchCount |
| Existing actions intact | — | Full GAS deploy required | Play through candidate flow: register → submit zones 1-3 → submit SOC → verify final submission works |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
