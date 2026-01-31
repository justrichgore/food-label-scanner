'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/utils/supabase';
import { ScoreDetails } from '@/utils/scoring';
import ScannerResults from '@/components/ScannerResults';
import Link from 'next/link';

interface ScanRecord {
    id: string;
    created_at: string;
    extracted_text: string;
    score_details: ScoreDetails;
    frequency: string;
    grade: string;
}

export default function HistoryPage() {
    const [scans, setScans] = useState<ScanRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);

    useEffect(() => {
        async function fetchScans() {
            const { data, error } = await supabase
                .from('scans')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching scans:', error);
            } else {
                setScans(data || []);
            }
            setLoading(false);
        }

        fetchScans();
    }, []);

    // Handle initial selection if needed, or just default to null

    return (
        <main className="min-h-screen pb-20 px-6 pt-12 max-w-md mx-auto relative z-10">
            <Navbar />

            {/* Selected Scan View */}
            {selectedScan ? (
                <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800">Scan Details</h2>
                        <button
                            onClick={() => setSelectedScan(null)}
                            className="text-sm text-slate-500 hover:text-emerald-600 px-3 py-1 rounded-full hover:bg-emerald-50 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                    <ScannerResults details={selectedScan.score_details} onReset={() => setSelectedScan(null)} />
                    <div className="my-8 border-b border-slate-200"></div>
                </div>
            ) : (
                <h1 className="text-2xl font-bold text-slate-800 mb-6">Scan History</h1>
            )}

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
            ) : scans.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                    <p>No scans yet.</p>
                    <Link href="/" className="text-emerald-500 font-medium mt-2 inline-block">
                        Start a new scan
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Header for list if selected */}
                    {selectedScan && (
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">Previous Scans</h3>
                    )}

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
                                <div className="text-xs text-slate-400 mb-1">
                                    {new Date(scan.created_at).toLocaleDateString()} at {new Date(scan.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold text-lg ${scan.grade === 'A' ? 'text-emerald-500' :
                                            scan.grade === 'B' ? 'text-teal-500' :
                                                scan.grade === 'C' ? 'text-yellow-500' :
                                                    scan.grade === 'D' ? 'text-orange-500' : 'text-red-500'
                                        }`}>
                                        Grade {scan.grade}
                                    </span>
                                </div>
                            </div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${selectedScan?.id === scan.id ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600'}`}>
                                {scan.score_details.score}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
