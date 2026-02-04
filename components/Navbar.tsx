'use client';

import Link from 'next/link';
import { ShieldCheck, User } from 'lucide-react';

export default function Navbar() {
    return (
        <div className="flex justify-between items-center mb-8">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-200">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="font-semibold text-slate-700">LabelScanner AI</span>
            </Link>

            <Link href="/account">
                <button className="w-10 h-10 rounded-full bg-white/50 backdrop-blur border border-white/60 flex items-center justify-center text-slate-500 hover:bg-white hover:text-emerald-600 transition-colors" aria-label="Account">
                    <User className="w-5 h-5" />
                </button>
            </Link>
        </div>
    );
}
