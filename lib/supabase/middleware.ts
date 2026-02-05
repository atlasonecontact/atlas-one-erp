import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase env vars are not set, skip auth and continue
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Supabase environment variables not configured. Skipping authentication.")
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
     if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
     }

     // Check profile status
     const { data: profile } = await supabase
       .from('profiles')
       .select('access_status')
       .eq('id', user.id)
       .single()

     const isAdmin = user.email === 'atlasonecontact@gmail.com';

     if (profile?.access_status === 'pending' && !isAdmin) {
       const url = request.nextUrl.clone()
       url.pathname = "/pending-approval"
       return NextResponse.redirect(url)
     }

     if (profile?.access_status === 'rejected' && !isAdmin) {
        // For rejected users, we might want to sign them out or show error
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        url.searchParams.set('error', 'account_rejected')
        return NextResponse.redirect(url)
     }
  }

  // Redirect logged-in users away from auth pages
  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
