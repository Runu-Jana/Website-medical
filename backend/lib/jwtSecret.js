// Single source of truth for the JWT signing secret. In production a real
// secret MUST be provided — we refuse to boot with the insecure dev fallback so
// tokens can never be forged with a well-known key.
const secret = process.env.JWT_SECRET;

if (!secret && process.env.NODE_ENV === 'production') {
  // Fail fast: a missing secret in production is a critical misconfiguration.
  console.error('FATAL: JWT_SECRET is not set. Refusing to start in production.');
  process.exit(1);
}

export const JWT_SECRET = secret || 'devsecret-not-for-production';
