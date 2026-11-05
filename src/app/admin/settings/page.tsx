import { requireAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import SettingsForm from './SettingsForm'

export const instant = false

export default async function AdminSettingsPage() {
  await requireAdmin()
  const settings = await db.listSettings()

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-[#f6f4ee]">Settings</h1>
        <p className="text-[#8c8c8c] text-sm mt-1">Store configuration</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  )
}
