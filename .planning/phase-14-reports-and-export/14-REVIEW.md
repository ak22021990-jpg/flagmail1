---
status: issues_found
files_reviewed: 4
depth: standard
critical: 1
warning: 1
info: 2
total: 4
---

# Code Review: Phase 14 — Reports and Export

## Summary

4 files reviewed at standard depth. 1 critical (print CSS hides all content), 1 warning (CSV formula injection), 2 info (print color contrast, code clarity).

---

## Findings

### CR-01 — Print CSS hides all content including report (CRITICAL)

**File:** `src/index.css:102`

**Issue:** The selector `body > :not(.print-target):not(.print-target *)` hides all direct children of `body` that are not `.print-target`. In the React DOM, `#root` is a direct child of `body` and does NOT have the `print-target` class — so `#root` gets `display: none !important`, hiding EVERYTHING including the `.print-target` div nested inside it. The print dialog will show a blank page.

**DOM structure at print time:**
```
body
  div#root         ← body > :not(.print-target) → HIDDEN
    div.style       ← child of hidden #root → also hidden
      div.print-target  ← also hidden (parent is hidden)
```

**Fix:** Replace the hide-everything-else approach with a visibility-based strategy:

```css
@media print {
  @page { margin: 12mm; }

  body {
    background: #fff !important;
    color: #000 !important;
  }

  body * {
    visibility: hidden !important;
  }

  .print-target, .print-target * {
    visibility: visible !important;
  }

  .print-target {
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    background: #fff !important;
    color: #000 !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border: none !important;
  }

  .no-print {
    display: none !important;
  }

  .print-page-break {
    page-break-after: always;
  }
}
```

**Severity:** Critical — Report printing is non-functional.

---

### WR-01 — CSV formula injection vulnerability (WARNING)

**File:** `src/utils/exportCsv.js:2`

**Issue:** `escapeCsvField` performs RFC 4180 escaping but does NOT guard against CSV formula injection (CWE-1236). Values beginning with `=`, `+`, `-`, or `@` will be interpreted as formulas when the CSV is opened in Excel or Google Sheets.

**Attack vector:** A candidate could set their name to `=cmd|'/C calc'!A0` which would execute on the admin's machine when the CSV is opened. Since the GAS backend specifically guards against this for sheet storage (Phase 5 requirement BACK-02), the CSV export creates an unprotected second path for the same data.

**Fix:** Prefix dangerous first characters with a single quote:

```js
export function escapeCsvField(value) {
  const s = String(value == null ? "" : value);
  const str = s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")
    ? '"' + s.replace(/"/g, '""') + '"'
    : s;
  if (/^[=+\-@]/.test(str)) return "'" + str;
  return str;
}
```

Note: The check should be on the FINAL escaped string (after quote wrapping), since `"=1+1"` is also treated as a formula by some spreadsheet apps.

**Severity:** Warning — Requires a candidate with malicious input; mitigated by GAS input validation but export path is unprotected.

---

### IN-01 — Print color contrast on highlights (INFO)

**File:** `src/components/AnswerSheet.jsx:82,89`

**Issue:** SPL keyword highlighting uses light backgrounds (`rgba(52,199,89,0.18)` for green, `rgba(10,132,255,0.12)` for blue) that render as very faint tints on white paper. In grayscale print, required and optional matched terms become visually indistinguishable from normal text.

**Suggestion:** Add `@media print` overrides for the highlight backgrounds to use stronger tints or underline/bold the matched terms:
```css
@media print {
  .spl-required { background: rgba(52,199,89,0.30) !important; }
  .spl-optional { background: rgba(10,132,255,0.25) !important; }
}
```
This requires adding `className` or `data-*` attributes to the highlight spans in `highlightSpl()`.

**Severity:** Info — Functional but degraded UX for printed reports.

---

### IN-02 — `handleCsvDownload` defined before `candidates` variable (INFO)

**File:** `src/components/AdminPanel.jsx:69,164`

**Issue:** The `handleCsvDownload` function (line 69) references `candidates` which is declared later (line 164). While safe at runtime (the button is only rendered after the variable is initialized), the ordering is fragile — if the function is ever called earlier in the render flow, it would hit the TDZ (Temporal Dead Zone).

**Suggestion:** Move `handleCsvDownload` below the `candidates` declaration, or memoize it with `useCallback` and pass `candidates` as a dependency. Given the current render structure this is not a bug, but it's a readability and future-refactor hazard.

**Severity:** Info — No current bug, code clarity improvement.

---

## Non-Findings (Reviewed, No Issues)

- **downloadCsv Blob cleanup:** `URL.revokeObjectURL(url)` called after click — correct.
- **CSV line endings:** `\r\n` used — Excel/Sheets compatible.
- **Print button `no-print` class:** Correctly scoped, hidden during print.
- **AnswerSheet `print-target` class:** Added to correct wrapper element.
- **CSV column names:** Human-readable, consistent with form labels.
- **Button styling:** Follows existing AdminPanel patterns.
- **No XSS in CSV:** CSV is downloaded as a file attachment, never rendered as HTML.
