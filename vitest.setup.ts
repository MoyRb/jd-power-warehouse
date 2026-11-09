/**
 * Vitest setup file — loads .env.local into process.env for each worker.
 * Runs before each test file in the worker context.
 * Provides credentials to integration tests without hardcoding them.
 */
import { loadEnv } from 'vite'

const env = loadEnv('test', process.cwd(), '')
Object.assign(process.env, env)
