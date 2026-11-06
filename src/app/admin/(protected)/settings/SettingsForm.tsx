'use client'

import { useState, useTransition } from 'react'
import { updateSettingsAction } from '@/app/admin/_actions/settings'

interface SettingsFormProps {
  settings: Record<string, unknown>
}

const FIELDS: { key: string; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: 'store_name', label: 'Store Name', placeholder: 'JD Power Warehouse' },
  {
    key: 'announcement_bar_text',
    label: 'Announcement Bar Text',
    placeholder: 'FREE LOCAL PICKUP — …',
    multiline: true,
  },
  { key: 'contact_phone', label: 'Contact Phone', placeholder: '+1 (815) 555-0123' },
  { key: 'contact_email', label: 'Contact Email', placeholder: 'info@example.com' },
  { key: 'business_hours', label: 'Business Hours', placeholder: 'Daily 6am–10pm' },
  { key: 'whatsapp_number', label: 'WhatsApp Number (digits only)', placeholder: '18155550123' },
]

const inputClass =
  'w-full px-3 py-2.5 bg-[#1a1a1a] border border-[#2e2e2e] text-[#f6f4ee] rounded-xl text-sm placeholder-[#8c8c8c] focus:outline-none focus:border-[#f3c41b] transition-colors'

export default function SettingsForm({ settings }: SettingsFormProps) {
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setSuccess(false)
    setError(null)
    startTransition(async () => {
      const result = await updateSettingsAction(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {success && (
        <div className="px-4 py-3 bg-green-900/20 border border-green-700/40 rounded-xl">
          <p className="text-green-400 text-sm">Settings saved successfully.</p>
        </div>
      )}
      {error && (
        <div className="px-4 py-3 bg-red-900/20 border border-red-700/40 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {FIELDS.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-[#f6f4ee] mb-1.5">
            {field.label}
          </label>
          {field.multiline ? (
            <textarea
              name={field.key}
              rows={3}
              defaultValue={String(settings[field.key] ?? '')}
              placeholder={field.placeholder}
              className={`${inputClass} resize-y`}
            />
          ) : (
            <input
              type="text"
              name={field.key}
              defaultValue={String(settings[field.key] ?? '')}
              placeholder={field.placeholder}
              className={inputClass}
            />
          )}
        </div>
      ))}

      <div className="pt-2">
        <p className="text-[#8c8c8c] text-xs mb-4">
          Note: Announcement bar and store name changes require the relevant components to read from the database. Currently they use static values — see ADMIN_BACKLOG.md.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 bg-[#f3c41b] text-[#0f0f0f] font-black text-sm rounded-xl hover:bg-[#e8b818] transition-colors disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </form>
  )
}
