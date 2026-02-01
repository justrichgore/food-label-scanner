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
        <main className="min-h-screen pb-20 px-6 pt-12 max-w-md mx-auto relative z-10">
            <Navbar />

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
                <h1 className="text-2xl font-bold text-slate-800 mb-6">Scan History</h1>
            )}

            {
                loading ? (
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
                )
            }
        </main >
    );
}
