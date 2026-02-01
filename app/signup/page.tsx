'use client'

import { signup } from './actions'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function SignupPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [errorInstance, setErrorInstance] = useState<string | null>(null)

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true)
        setErrorInstance(null)
        try {
            await signup(formData)
        } catch (e: any) {
            if (e.message === 'NEXT_REDIRECT') throw e;
            setErrorInstance(e.message || "Signup failed. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                <div className="text-center">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Create Account</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Start your journey to safer eating today
                    </p>
                </div>

                <form action={handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">Full Name</label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                required
                                className="mt-1 block w-full px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1 block w-full px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                className="mt-1 block w-full px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="intent" className="block text-sm font-medium text-slate-700">Primary Goal</label>
                            <select
                                id="intent"
                                name="intent"
                                required
                                className="mt-1 block w-full px-3 py-3 border border-slate-300 bg-white rounded-lg focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                            >
                                <option value="" disabled selected>Select your goal...</option>
                                <option value="Lose Weight">Lose Weight</option>
                                <option value="Avoid Allergens">Avoid Allergens</option>
                                <option value="Eat Cleaner/Organic">Eat Cleaner/Organic</option>
                                <option value="Manage Health Condition">Manage Health Condition</option>
                                <option value="General Curiosity">General Curiosity</option>
                            </select>
                        </div>
                    </div>

                    {errorInstance && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                            {errorInstance}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-full text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-70"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
                        </button>
                    </div>
                </form>

                <div className="text-center">
                    <p className="text-sm text-slate-600">
                        Already have an account?{' '}
                        <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
