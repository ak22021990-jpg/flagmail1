# Phase 11: Admin Infrastructure - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning
**Source:** ROADMAP.md v1.2 + Codebase Research

<domain>
## Phase Boundary

Replace the existing ReviewerScreen with a lazy-loaded AdminPanel entry point. The admin panel is reachable from the app, passcode-gated using the existing GAS `getAdminData` endpoint, and capable of refreshing data on demand. The reviewer screen component is fully replaced — not supplemented. Admin bundle is lazy-loaded so candidates never download admin code during normal gameplay.
</domain>

<decisions>
## Implementation Decisions

### Architecture
- AdminPanel replaces ReviewerScreen — new component, not a wrapper around old one
- AdminPanel imported via `React.lazy` + `<Suspense>` for code splitting
- New `SCREENS.ADMIN` added to useGameState enum
- "Admin" button added to landing page (near existing "Reviewer" button)

### Passcode Gate
- Passcode validated against existing GAS `getAdminData` POST endpoint (already implemented)
- `checkPasscode()` in GAS validates against `PropertiesService.REVIEWER_PASSCODE`
- Passcode not hardcoded in client bundle — validated server-side only
- POST payload: `{ action: "getAdminData", passcode: "..." }`
- Response: `{ ok: true, candidates: [...], rawData: [...], socData: [...] }` on success
- Response: `{ ok: false, error: "Unauthorized" }` on failure

### Data Fetching
- useAdmin hook owns all admin state (data, loading, error, passcode validation)
- `fetchAdminData(passcode)` calls GAS POST endpoint
- Manual refresh button re-fetches without page reload

### the agent's Discretion
- Exact UI layout of AdminPanel (grid, tabs, sections)
- Error message text and styling
- Loading indicator style
- Button placement and styling on landing page
- Whether to show raw data immediately or as collapsible sections
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing code
- `src/components/ReviewerScreen.jsx` — Current reviewer screen to understand existing passcode flow
- `src/hooks/useGameState.js` — SCREENS enum, setScreen, submitToSheet POST pattern
- `src/App.jsx` — Screen routing pattern, import structure
- `src/config.js` — LEADERBOARD_URL constant
- `google-apps-script.js` — getAdminData endpoint (lines 291-377), checkPasscode (lines 478-481)

### Planning artifacts
- `.planning/ROADMAP.md` — Phase 11 requirements ADMN-01 through ADMN-04
- `.planning/REQUIREMENTS.md` — Project-level requirements
</canonical_refs>

<specifics>
## Specific Ideas

- AdminPanel shows three data sections: Candidates (Summary sheet), Raw Classifications (RawData sheet), SOC Answers (SOCData sheet)
- Each data section is a collapsible panel for progressive disclosure
- Refresh button in top bar of admin panel
- Back button returns to landing screen
- Loading spinner while fetching data
- Error state with retry option if passcode invalid or network fails
</specifics>

<deferred>
## Deferred Ideas

- Candidate delete/edit CRUD (Phase 12+)
- Candidate search/sort/filter table (Phase 12)
- Answer sheet drill-down (Phase 13)
- CSV export (Phase 14)
- PDF reports (Phase 14)
</deferred>

---

*Phase: 11-admin-infrastructure*
*Context gathered: 2026-05-26 via codebase research + ROADMAP.md*
