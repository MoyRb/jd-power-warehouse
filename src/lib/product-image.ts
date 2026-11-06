/**
 * Resolves a product image storage path to a displayable URL.
 * - Local paths starting with `/` are used as-is.
 * - Mock paths (mock://) return a placeholder.
 * - Supabase storage paths will eventually return signed URLs (stubbed for now).
 */
export function getProductImageSrc(storagePath: string): string | null {
  if (!storagePath) return null
  if (storagePath.startsWith('/')) return storagePath
  if (storagePath.startsWith('mock://')) return null // placeholder rendered by caller
  // Supabase Storage — in production: generate a signed URL here
  return storagePath
}
