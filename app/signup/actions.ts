'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const intent = formData.get('intent') as string

    // 1. Sign Up User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            // Optional: Add email verification flow if needed.
            // For now, we assume implicit login on signup if auto-confirm is on in Supabase,
            // OR we handle the "check email" state.
            // BUT, we want to insert profile immediately.
            data: {
                full_name: fullName,
                usage_intent: intent
            }
        }
    })

    if (authError) {
        throw new Error(authError.message)
    }

    // 2. Insert Profile (If using Supabase Auth Triggers, this might be redundant, but manual is safer here)
    if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            full_name: fullName,
            usage_intent: intent
        })

        if (profileError) {
            console.error("Profile creation failed:", profileError)
            // Non-blocking error? Or should we rollback?
            // Since user is created, we probably shouldn't fail totally, but logging is vital.
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
