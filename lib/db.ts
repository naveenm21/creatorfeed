import 'server-only'
import { Pool, types, type PoolConfig, type QueryResultRow } from 'pg'
import fs from 'node:fs'

// Return timestamps as ISO strings (like Supabase/PostgREST did) instead of Date objects,
// so rows stay serializable as Server → Client component props.
const toIso = (v: string | null) => (v === null ? null : new Date(v).toISOString())
types.setTypeParser(types.builtins.TIMESTAMPTZ, toIso)
types.setTypeParser(types.builtins.TIMESTAMP, (v) => (v === null ? null : new Date(v + 'Z').toISOString()))
// count(*) is bigint → keep numbers as numbers (our counts are far below 2^53).
types.setTypeParser(types.builtins.INT8, (v) => (v === null ? null : Number(v)))

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** Guard ids before querying: Postgres rejects malformed uuids with an error. */
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v)

/**
 * Postgres (Cloud SQL) connection pool. Server-only: never import from client components.
 *
 * DATABASE_URL     postgresql://user:pass@host:5432/creatorfeed[?sslmode=require]
 * DATABASE_CA_CERT optional: Cloud SQL server CA, as a PEM string or a path to the .pem file.
 *                  When set, the server certificate chain is verified. Cloud SQL certs don't
 *                  carry the IP as hostname, so only the chain is checked, not the hostname.
 */
function buildConfig(): PoolConfig {
  const raw = process.env.DATABASE_URL
  if (!raw) throw new Error('DATABASE_URL is not set')

  // pg lets sslmode in the URL override the `ssl` object, so strip it and configure SSL here.
  const wantsSsl = /[?&]sslmode=(require|verify-ca|verify-full|prefer)/.test(raw)
  const connectionString = raw.replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '')

  const caEnv = process.env.DATABASE_CA_CERT
  let ssl: PoolConfig['ssl'] = undefined
  if (caEnv) {
    const ca = caEnv.includes('BEGIN CERTIFICATE') ? caEnv : fs.readFileSync(caEnv, 'utf8')
    ssl = { ca, checkServerIdentity: () => undefined }
  } else if (wantsSsl) {
    // Fail closed: without the CA we cannot verify the server. Download it from
    // Cloud SQL → Connections → Security → "Download server CA certificate".
    // Local development may opt in to encrypted-but-unverified TLS explicitly.
    if (process.env.DATABASE_SSL_INSECURE !== '1') {
      throw new Error(
        'DATABASE_CA_CERT is required for SSL connections (set DATABASE_SSL_INSECURE=1 only for local development)'
      )
    }
    console.warn('[db] DATABASE_SSL_INSECURE=1: TLS is encrypted but the server certificate is NOT verified')
    ssl = { rejectUnauthorized: false }
  }

  return {
    connectionString,
    ssl,
    max: Number(process.env.DATABASE_POOL_MAX || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  }
}

// Reuse one pool across hot reloads in dev.
const globalForDb = globalThis as unknown as { __pgPool?: Pool }
export const pool: Pool = globalForDb.__pgPool ?? new Pool(buildConfig())
if (process.env.NODE_ENV !== 'production') globalForDb.__pgPool = pool

/** Run a query and return all rows. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await pool.query<T>(text, params)
  return res.rows
}

/** Run a query and return the first row, or null. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const res = await pool.query<T>(text, params)
  return res.rows[0] ?? null
}
