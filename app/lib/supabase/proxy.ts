import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getSupabaseEnv } from "@/lib/supabase/env"

const AUTH_ROUTE = "/auth"
const HOME_ROUTE = "/"
const DASHBOARD_ROUTE = "/dashboard"

function isPublicPath(pathname: string) {
  return pathname === HOME_ROUTE || pathname === AUTH_ROUTE
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const { url: supabaseUrl, publishableKey } = getSupabaseEnv()
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

        response = NextResponse.next({
          request,
        })

        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublic = isPublicPath(pathname)
  const isAuthPath = pathname === AUTH_ROUTE

  if (!user && !isPublic) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = AUTH_ROUTE
    redirectUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthPath) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = DASHBOARD_ROUTE
    return NextResponse.redirect(redirectUrl)
  }

  return response
}
