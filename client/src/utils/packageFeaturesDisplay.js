/**
 * User-facing package feature lines. Enriches catalog copy where we want
 * consistent emphasis (e.g. clinical scenario practice).
 */
export function packageFeaturesForDisplay(features) {
  const list = Array.isArray(features) ? features.map(String) : [];
  return list.map((line) => enrichClinicalScenarioLine(line));
}

function enrichClinicalScenarioLine(text) {
  const s = String(text).trim();
  if (!s) return s;
  if (!/clinical\s+scenario/i.test(s)) return s;
  if (/recommended\s+to\s+pass\s+the\s+exam/i.test(s)) return s;
  return `${s} (recommended to pass the exam)`;
}
