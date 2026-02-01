import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protected Routes Logic
    // If user is NOT signed in and the current path is NOT /login or /signup or /auth/*
    // then redirect to /login
    const path = request.nextUrl.pathname;
    const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/auth');

    if (!user && !isAuthRoute) {
        // Redirect to login
        // Note: We might want to allow some public assets (handled by config matcher in middleware.ts somewhat)
        // But for the main app logic:
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Optional: If user IS signed in and tries to go to /login or /signup, redirect to /
    if (user && isAuthRoute && !path.startsWith('/auth/callback')) {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
    }

    return response
}
