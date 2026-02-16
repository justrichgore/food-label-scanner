'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, User, ScanLine, LogOut } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Scan', href: '/', icon: ScanLine },
        { name: 'History', href: '/history', icon: History },
        // { name: 'Account', href: '/account', icon: User }, // Uncomment when account page is ready
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 p-6 z-50">
            {/* Brand */}
            <div className="mb-10 px-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
                    L
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                    LabelScanner
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <Icon size={20} className={`${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-500'} transition-colors`} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User / Footer Area */}
            <div className="mt-auto pt-6 border-t border-slate-100">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 font-bold shadow-sm">
                            U
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">User Account</p>
                            <p className="text-xs text-slate-500">Free Plan</p>
                        </div>
                    </div>
                    {/* Placeholder for sign out or upgrade */}
                    <button className="w-full text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline text-center">
                        Upgrade to Pro
                    </button>
                </div>
            </div>
        </aside>
    );
}
