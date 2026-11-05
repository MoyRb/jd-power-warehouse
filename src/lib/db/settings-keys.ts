export const SETTINGS_KEYS = {
  STORE_NAME: 'store_name',
  ANNOUNCEMENT_BAR_TEXT: 'announcement_bar_text',
  CONTACT_PHONE: 'contact_phone',
  CONTACT_EMAIL: 'contact_email',
  BUSINESS_HOURS: 'business_hours',
  WHATSAPP_NUMBER: 'whatsapp_number',
} as const

export type SettingsKey = (typeof SETTINGS_KEYS)[keyof typeof SETTINGS_KEYS]
