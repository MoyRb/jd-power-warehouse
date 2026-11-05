'use client'

import { useSearchParams } from 'next/navigation'
import { loginAction } from './actions'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Invalid email or password.',
  missing_fields: 'Email and password are required.',
  not_configured: 'Admin login is not available in this environment.',
}

const inputClass =
  'w-full px-4 py-3 bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] rounded-xl text-sm placeholder-[#8c8c8c] focus:outline-none focus:border-[#f3c41b] transition-colors'

export default function LoginForm() {
  const searchParams = useSearchParams()
  const errorKey = searchParams.get('error')
  const errorMessage = errorKey ? (ERROR_MESSAGES[errorKey] ?? 'An error occurred.') : null

  return (
    <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-8">
      <h2 className="text-[#f6f4ee] font-bold text-lg mb-6">Sign In</h2>

      {errorMessage && (
        <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-700/40 rounded-lg">
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}

      <form action={loginAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#f6f4ee] mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="admin@example.com"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f6f4ee] mb-1.5">
            Password
          </label>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#f3c41b] text-[#0f0f0f] font-black text-sm py-3.5 rounded-xl hover:bg-[#e8b818] transition-colors mt-2"
        >
          Sign In
        </button>
      </form>
    </div>
  )
}
