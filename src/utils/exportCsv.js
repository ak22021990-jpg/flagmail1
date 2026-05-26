export function escapeCsvField(value) {
  const s = String(value == null ? "" : value);
  let escaped = s;
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    escaped = '"' + s.replace(/"/g, '""') + '"';
  }
  if (/^[=+\-@]/.test(escaped)) {
    return "'" + escaped;
  }
  return escaped;
}

export function downloadCsv(rows, filename) {
  if (!rows || rows.length === 0) return;

  const header = Object.keys(rows[0]).map(escapeCsvField).join(",");
  const body = rows.map((row) =>
    Object.values(row).map(escapeCsvField).join(",")
  ).join("\r\n");

  const blob = new Blob([header + "\r\n" + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
