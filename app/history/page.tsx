'use client';

import { Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { createClient } from '@/utils/supabase/client';
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

export default function HistoryPage() {
    const [scans, setScans] = useState<ScanRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);

    const supabase = createClient();

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

        // 1. Recalculate Score
        const newScoreDetails = calculateScore(selectedScan.extracted_text, newFrequency);

        // 2. Optimistic UI Update
        const updatedScan = {
            ...selectedScan,
            frequency: newFrequency,
            score_details: newScoreDetails,
            grade: newScoreDetails.grade
        };
        setSelectedScan(updatedScan);
        setScans(scans.map(s => s.id === selectedScan.id ? updatedScan : s));

        // 3. Persist to DB
        const { error } = await updateScanFrequency(selectedScan.id, newFrequency, newScoreDetails);

        if (error) {
            console.error("Failed to update frequency:", error);
            alert("Failed to save changes. Please try again.");
            // Revert on error (optional, but good practice)
            // For now, simpler to just alert. 
        }
    };

    // Handle initial selection if needed, or just default to null

    return (
        <main className="min-h-screen pb-20 pt-8 px-6 w-full relative z-10 md:overflow-hidden md:h-screen md:pb-0">
            <Navbar />

            {/* Desktop: Split View Container */}
            <div className="max-w-md mx-auto md:max-w-none md:mx-0 h-full flex flex-col md:flex-row gap-6 md:gap-0">

                {/* LIST COLUMN (Left on desktop, full on mobile) */}
                <div className={`flex flex-col h-full md:w-1/3 lg:w-1/4 md:border-r md:border-slate-200 md:pr-6 w-full ${selectedScan ? 'hidden md:flex' : 'flex'}`}>
                    <h1 className="text-2xl font-bold text-slate-900 mb-6 shrink-0">Scan History</h1>
                    <div className="flex-1 overflow-y-auto min-h-0 -mr-4 pr-4">

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
                            <div className="space-y-3 pb-20 md:pb-0">
                                {scans.map((scan) => (
                                    <div
                                        key={scan.id}
                                        onClick={() => setSelectedScan(scan)}
                                        className={`p-4 rounded-xl flex justify-between items-center transition-all cursor-pointer border shadow-sm ${selectedScan?.id === scan.id
                                            ? 'bg-emerald-900 text-white border-emerald-900 ring-2 ring-emerald-500/20'
                                            : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                                            }`}
                                    >
                                        <div className="min-w-0 flex-1 mr-3">
                                            <div className={`font-semibold mb-0.5 truncate ${selectedScan?.id === scan.id ? 'text-white' : 'text-slate-800'}`}>
                                                {scan.name || 'Untitled Scan'}
                                            </div>
                                            <div className={`text-xs ${selectedScan?.id === scan.id ? 'text-emerald-200' : 'text-slate-400'}`}>
                                                {new Date(scan.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${scan.grade === 'A' ? (selectedScan?.id === scan.id ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700') :
                                                scan.grade === 'B' ? (selectedScan?.id === scan.id ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-700') :
                                                    scan.grade === 'C' ? (selectedScan?.id === scan.id ? 'bg-white/20 text-white' : 'bg-yellow-100 text-yellow-700') :
                                                        (selectedScan?.id === scan.id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700')
                                                }`}>
                                                {scan.grade}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(scan.id);
                                                }}
                                                className={`p-2 rounded-full transition-colors ${selectedScan?.id === scan.id ? 'text-emerald-300 hover:text-white hover:bg-white/20' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                                                title="Delete Scan"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* DETAILS COLUMN (Right on desktop, full overlay on mobile) */}
                <div className={`flex-1 md:pl-8 md:overflow-y-auto h-full ${selectedScan ? 'block' : 'hidden md:flex md:items-center md:justify-center'}`}>
                    {selectedScan ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 md:max-w-3xl md:mx-auto pb-20 md:pb-10">
                            {/* Mobile Back Button / Header */}
                            <div className="flex items-center gap-4 mb-6 md:hidden">
                                <button
                                    onClick={() => setSelectedScan(null)}
                                    className="p-2 -ml-2 text-slate-500 hover:text-slate-900"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                </button>
                                <span className="font-bold text-lg">Details</span>
                            </div>

                            {/* Desktop Header */}
                            <div className="hidden md:flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                                <div>
                                    <h2 className="text-3xl font-bold text-slate-900">{selectedScan.name || 'Untitled Scan'}</h2>
                                    <p className="text-slate-500 mt-1">Scanned on {new Date(selectedScan.created_at).toLocaleDateString()} at {new Date(selectedScan.created_at).toLocaleTimeString()}</p>
                                </div>
                                <div className="glass-card p-1.5 rounded-full flex gap-1">
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

                            {/* Mobile Frequency - Keep separate for layout */}
                            <div className="glass-card p-1.5 rounded-full flex gap-1 mb-6 md:hidden overflow-x-auto">
                                {(['Daily', 'Weekly', 'Rare'] as Frequency[]).map((freq) => (
                                    <button
                                        key={freq}
                                        onClick={() => handleFrequencyChange(freq)} // Note: You need to make handleFrequencyChange update state locally too if not already
                                        className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${selectedScan.frequency === freq
                                            ? 'bg-slate-900 text-white shadow-md'
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                            }`}
                                    >
                                        {freq}
                                    </button>
                                ))}
                            </div>

                            {/* Reuse ScannerResults but potentially wrap it to look better full width */}
                            <div className="bg-white rounded-3xl md:p-8 md:shadow-sm md:border md:border-slate-100">
                                <ScannerResults details={selectedScan.score_details} onReset={() => { }} />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                👈
                            </div>
                            <p className="text-lg font-medium">Select a scan to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
