function normalize(text) {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function matches(term, text) {
  if (typeof term === "string") return text.includes(term.toLowerCase());
  if (term && typeof term === "object" && term.anyOf)
    return term.anyOf.some((a) => text.includes(a.toLowerCase()));
  return false;
}

export function validateSpl(splText, rules) {
  const norm = normalize(splText);
  const required = { hits: [], misses: [] };
  const optional = { hits: [], misses: [] };
  const blocked = { hits: [] };

  for (const term of rules.required || []) {
    if (matches(term, norm)) required.hits.push(term);
    else required.misses.push(term);
  }

  for (const term of rules.optional || []) {
    if (matches(term, norm)) optional.hits.push(term);
    else optional.misses.push(term);
  }

  for (const term of rules.blocked || []) {
    if (matches(term, norm)) blocked.hits.push(term);
  }

  return { required, optional, blocked };
}

