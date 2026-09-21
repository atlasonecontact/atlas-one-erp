import { type EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = (searchParams.get("type") as EmailOtpType | null) ?? "recovery"
  const next = searchParams.get("next") ?? "/reset-password"

  if (token_hash) {
    const supabase = await createServerClient()

    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    return NextResponse.redirect(
      `${origin}/auth/callback?error_description=${encodeURIComponent(error.message)}`,
    )
  }

  return NextResponse.redirect(
    `${origin}/auth/callback?error_description=${encodeURIComponent("El link para restablecer la contraseña no es válido o ya expiró.")}`,
  )
}
