/**
 * Global setup for Vitest — loads .env.local into process.env
 * so integration tests can access Supabase credentials.
 *
 * Uses Vite's loadEnv (available as a transitive dep) with an empty prefix
 * to load ALL variables from .env and .env.local.
 */
import { loadEnv } from 'vite'

export async function setup() {
  // Load all env vars (empty prefix = no filtering by prefix)
  const env = loadEnv('test', process.cwd(), '')
  Object.assign(process.env, env)
}
