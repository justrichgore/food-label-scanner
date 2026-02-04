'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Trash2, User as UserIcon, LogOut } from 'lucide-react';
import { ScoreDetails, calculateScore, Frequency } from '@/utils/scoring';
import { updateScanFrequency } from '@/utils/supabase-legacy';
import ScannerResults from '@/components/ScannerResults';
import Link from 'next/link';

interface ScanRecord {
    id: string;
    created_at: string;
    extracted_text: string;
    score_details: ScoreDetails;
    frequency: Frequency;
    grade: string;
    name?: string;
}

export default function AccountPage() {
    const [user, setUser] = useState<User | null>(null);
    const [scans, setScans] = useState<ScanRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
    const router = useRouter();

    const supabase = createClient();

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);

            const { data, error } = await supabase
                .from('scans')
                .select('*')
                .eq('user_id', user.id) // Explicitly filter by user_id, though RLS should handle it
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching scans:', error);
            } else {
                setScans(data || []);
            }
            setLoading(false);
        }

        loadData();
    }, [router, supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this scan?')) return;

        const { error, count } = await supabase
            .from('scans')
            .delete({ count: 'exact' })
            .eq('id', id);

        if (error) {
            console.error('Error deleting scan:', error);
            alert('Failed to delete scan: ' + error.message);
        } else if (count === 0) {
            console.error('No scan deleted (RLS or ID mismatch)');
            alert('Could not delete scan. You may not have permission.');
        } else {
            setScans(scans.filter(scan => scan.id !== id));
            if (selectedScan?.id === id) {
                setSelectedScan(null);
            }
        }
    };

    const handleFrequencyChange = async (newFrequency: Frequency) => {
        if (!selectedScan) return;

        const newScoreDetails = calculateScore(selectedScan.extracted_text, newFrequency);

        const updatedScan = {
            ...selectedScan,
            frequency: newFrequency,
            score_details: newScoreDetails,
            grade: newScoreDetails.grade
        };
        setSelectedScan(updatedScan);
        setScans(scans.map(s => s.id === selectedScan.id ? updatedScan : s));

        const { error } = await updateScanFrequency(selectedScan.id, newFrequency, newScoreDetails);

        if (error) {
            console.error("Failed to update frequency:", error);
            alert("Failed to save changes. Please try again.");
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen pb-20 px-6 pt-12 max-w-md mx-auto relative z-10">
                <Navbar />
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen pb-20 px-6 pt-12 max-w-md mx-auto relative z-10">
            <Navbar />

            {/* User Profile Section */}
            {!selectedScan && user && (
                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
                    <h1 className="text-2xl font-bold text-slate-800 mb-6">My Account</h1>

                    <div className="glass-card p-6 rounded-2xl border border-white/60 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-emerald-400/20"></div>

                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                                <UserIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <div className="text-sm text-slate-500 font-medium">Signed in as</div>
                                <div className="font-semibold text-slate-800 break-all">{user.email}</div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 relative z-10">
                            <div className="flex justify-between items-center text-sm py-2 border-t border-slate-100">
                                <span className="text-slate-500">Member since</span>
                                <span className="font-medium text-slate-700">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm py-2 border-t border-slate-100">
                                <span className="text-slate-500">Total Scans</span>
                                <span className="font-medium text-slate-700">{scans.length}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSignOut}
                            className="mt-6 w-full py-3 rounded-xl bg-slate-50 text-slate-600 font-medium flex items-center justify-center gap-2 hover:bg-slate-100 hover:text-red-500 transition-colors group/btn"
                        >
                            <LogOut className="w-4 h-4 group-hover/btn:text-red-500 transition-colors" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}

            {/* Selected Scan View */}
            {selectedScan ? (
                <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800">{selectedScan.name || 'Scan Details'}</h2>
                        <button
                            onClick={() => setSelectedScan(null)}
                            className="text-sm text-slate-500 hover:text-emerald-600 px-3 py-1 rounded-full hover:bg-emerald-50 transition-colors"
                        >
                            Close
                        </button>
                    </div>

                    {/* Frequency Settings Pill */}
                    <div className="glass-card p-2 rounded-full flex items-center justify-between pl-6 pr-2 mb-6">
                        <span className="text-sm font-semibold text-slate-600">Consumption:</span>
                        <div className="flex gap-1">
                            {(['Daily', 'Weekly', 'Rare'] as Frequency[]).map((freq) => (
                                <button
                                    key={freq}
                                    onClick={() => handleFrequencyChange(freq)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${selectedScan.frequency === freq
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                        }`}
                                >
                                    {freq}
                                </button>
                            ))}
                        </div>
                    </div>

                    <ScannerResults details={selectedScan.score_details} onReset={() => setSelectedScan(null)} />
                    <div className="my-8 border-b border-slate-200"></div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Scan History</h2>

                    {scans.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 glass-card rounded-xl border border-white/60">
                            <p>No scans yet.</p>
                            <Link href="/" className="text-emerald-500 font-medium mt-2 inline-block hover:underline">
                                Start a new scan
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {scans.map((scan) => (
                                <div
                                    key={scan.id}
                                    onClick={() => {
                                        setSelectedScan(scan);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={`glass-card p-4 rounded-xl flex justify-between items-center transition-all cursor-pointer border shadow-sm ${selectedScan?.id === scan.id ? 'ring-2 ring-emerald-500 bg-emerald-50/50 border-emerald-200' : 'hover:bg-white/60 border-white/60'}`}
                                >
                                    <div>
                                        <div className="font-semibold text-slate-800 mb-0.5">
                                            {scan.name || 'Untitled Scan'}
                                        </div>
                                        <div className="text-xs text-slate-400 mb-1">
                                            {new Date(scan.created_at).toLocaleDateString()} at {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold text-sm ${scan.grade === 'A' ? 'text-emerald-500' :
                                                scan.grade === 'B' ? 'text-teal-500' :
                                                    scan.grade === 'C' ? 'text-yellow-500' :
                                                        scan.grade === 'D' ? 'text-orange-500' : 'text-red-500'
                                                }`}>
                                                Grade {scan.grade}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selectedScan?.id === scan.id ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600'}`}>
                                            {scan.score_details.score}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(scan.id);
                                            }}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            title="Delete Scan"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
