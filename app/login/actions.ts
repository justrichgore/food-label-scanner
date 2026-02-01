'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        // In a real app we might return the error to the client component to display
        // For now we'll throw to be caught by the form handler if possible or just log
        redirect('/login?error=Invalid login credentials')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
