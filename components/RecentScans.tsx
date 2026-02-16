'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ScoreDetails } from '@/utils/scoring';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

interface ScanRecord {
    id: string;
    created_at: string;
    extracted_text: string;
    score_details: ScoreDetails; // Assuming this is stored as JSONB
    frequency: string;
    grade: string;
    name?: string;
}

export default function RecentScans() {
    const [scans, setScans] = useState<ScanRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchRecentScans() {
            const { data, error } = await supabase
                .from('scans')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(4);

            if (!error && data) {
                setScans(data);
            }
            setLoading(false);
        }
        fetchRecentScans();
    }, []);

    if (loading) return <div className="animate-pulse h-32 bg-slate-100 rounded-xl w-full"></div>;

    if (scans.length === 0) {
        return (
            <div className="p-6 rounded-2xl bg-white border border-slate-100 text-center">
                <p className="text-slate-400 text-sm">No recent scans found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-lg">Recent Activity</h3>
                <Link href="/history" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 group">
                    View all <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scans.map((scan) => (
                    <div key={scan.id} className="group p-4 bg-white hover:bg-emerald-50/30 border border-slate-100 hover:border-emerald-100 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${scan.grade === 'A' ? 'bg-emerald-500' :
                                        scan.grade === 'B' ? 'bg-teal-500' :
                                            scan.grade === 'C' ? 'bg-yellow-500' :
                                                'bg-red-500'
                                    }`}></span>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Grade {scan.grade}</span>
                            </div>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock size={10} />
                                {formatDistanceToNow(new Date(scan.created_at), { addSuffix: true })}
                            </span>
                        </div>

                        <h4 className="font-bold text-slate-800 line-clamp-1 mb-1 group-hover:text-emerald-700 transition-colors">
                            {scan.name || 'Untitled Scan'}
                        </h4>

                        <div className="flex items-end justify-between mt-3">
                            <div className="text-xs text-slate-500">
                                Score: <span className="font-bold text-slate-700">{scan.score_details?.score || 0}</span>/100
                            </div>

                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
