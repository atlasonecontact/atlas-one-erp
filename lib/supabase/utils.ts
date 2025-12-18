import type { PostgrestSingleResponse } from "@supabase/supabase-js"

/**
 * Safely get a single row from Supabase, handling the PGRST116 error
 * Returns null if no row is found instead of throwing an error
 */
export async function getSingleOrNull<T>(query: Promise<PostgrestSingleResponse<T>>): Promise<T | null> {
  try {
    const { data, error } = await query

    // Handle the "no rows" error gracefully
    if (error && error.code === "PGRST116") {
      return null
    }

    // Handle other errors
    if (error) {
      console.error("[v0] Supabase error:", error)
      return null
    }

    return data
  } catch (err) {
    console.error("[v0] Unexpected error:", err)
    return null
  }
}

/**
 * Check if a Supabase error is a "no rows" error
 */
export function isNoRowsError(error: any): boolean {
  return error?.code === "PGRST116"
}
