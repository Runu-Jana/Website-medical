// Turn a free-text salt/composition into a comparable "molecule signature" so
// the same medicine groups across brands even when the text differs:
//   "Paracetamol (650mg)", "Paracetamol 650 mg IP", "paracetamol"  → "paracetamol"
//   "Amoxicillin 500mg + Clavulanic Acid 125mg"  → "amoxicillin+clavulanic acid"
// Combination drugs keep every molecule, so plain Paracetamol never matches
// Paracetamol + Caffeine.

// Words that are dosage form / pharmacopoeia noise, not molecule names.
const NOISE = new Set([
  'ip', 'bp', 'usp', 'ep', 'jp', 'ph', 'eur',
  'tablet', 'tablets', 'tab', 'tabs', 'capsule', 'capsules', 'cap', 'caps',
  'oral', 'suspension', 'syrup', 'injection', 'solution', 'cream', 'gel',
  'ointment', 'drops', 'sachet', 'powder', 'film', 'coated', 'extended',
  'release', 'sr', 'xr', 'er', 'cr', 'md', 'mr', 'dt', 'od',
  'mg', 'mcg', 'ug', 'ml', 'gm', 'g', 'kg', 'iu', 'unit', 'units', 'w', 'v',
])

// Reduce a single molecule token to its bare name (no strength / units / punctuation).
function cleanMolecule(token) {
  return token
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')                                  // drop "(650mg)" etc.
    .replace(/\b\d+(\.\d+)?\s*(mg|mcg|ug|ml|gm|g|kg|iu|%|units?)\b/gi, ' ') // strip "650 mg"
    .replace(/(^|\s)\d+(\.\d+)?(?=\s|$)/g, ' ')                  // strip standalone numbers (keeps "b12")
    .replace(/[^a-z0-9\s]/g, ' ')                                // drop punctuation, keep alphanumerics
    .split(/\s+/)
    .filter((w) => w && !NOISE.has(w))
    .join(' ')
    .trim()
}

// Full signature: every molecule, de-duped and sorted, joined with "+".
export function moleculeSignature(salt) {
  if (!salt) return ''
  const parts = String(salt)
    .split(/\s*[+&/,]\s*|\band\b/i) // split combination drugs
    .map(cleanMolecule)
    .filter(Boolean)
  return [...new Set(parts)].sort().join('+')
}

// The primary molecule name — a cheap, broad term to query the backend with
// before filtering the results down to an exact signature match on the client.
export function primaryMolecule(salt) {
  return moleculeSignature(salt).split('+')[0] || ''
}
