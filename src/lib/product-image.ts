/**
 * Resolves a product image storage path to a displayable URL.
 * - Local paths starting with `/` are used as-is.
 * - Mock paths (mock://) return null — caller renders a placeholder.
 * - Full http(s) URLs are returned as-is.
 * - Bare Supabase storage paths (e.g. "productId/imageId.jpg") are
 *   expanded to a full public Storage URL using the provided supabaseUrl.
 *   Returns null when supabaseUrl is not available.
 */
export function getProductImageSrc(
  storagePath: string,
  supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL,
): string | null {
  if (!storagePath) return null
  if (storagePath.startsWith('/')) return storagePath
  if (storagePath.startsWith('mock://')) return null
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) return storagePath
  // Bare Supabase storage path — construct public bucket URL
  if (!supabaseUrl) return null
  return `${supabaseUrl}/storage/v1/object/public/product-images/${storagePath}`
}
