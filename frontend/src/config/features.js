// ─────────────────────────────────────────────────────────────────────────
//  Customer-facing feature toggles.
//  Flip a flag to `true` to re-enable that feature across the whole storefront
//  (tiles, routes, links and copy) — no other code changes needed.
// ─────────────────────────────────────────────────────────────────────────
export const FEATURES = {
  // Doctor consultation. When false, customers can't see or book doctors
  // anywhere on the storefront. The doctor data + pages + admin management all
  // still exist — just set this to `true` to relaunch the feature instantly.
  doctors: false,
}
