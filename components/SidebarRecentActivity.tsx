'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ScoreDetails } from '@/utils/scoring';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface ScanRecord {
    id: string;
    created_at: string;
    extracted_text: string;
    score_details: ScoreDetails;
    frequency: string;
    grade: string;
    name?: string;
}

export default function SidebarRecentActivity() {
    const [scans, setScans] = useState<ScanRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchRecentScans() {
            const { data, error } = await supabase
                .from('scans')
                .select('id, created_at, grade, name, score_details')
                .order('created_at', { ascending: false })
                .limit(5);

            if (!error && data) {
                // @ts-expect-error - score_details type might be tricky with partial select
                setScans(data);
            }
            setLoading(false);
        }
        fetchRecentScans();
    }, []);

    if (loading) return (
        <div className="space-y-3 mt-6">
            <div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div>
            {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse"></div>
            ))}
        </div>
    );

    if (scans.length === 0) return null;

    return (
        <div className="mt-8 flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Activity</h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 -mr-2 space-y-2 pb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {scans.map((scan) => (
                    <Link
                        key={scan.id}
                        href={`/history?id=${scan.id}`}
                        className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-200"
                    >
                        <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-700 truncate group-hover:text-emerald-700 transition-colors">
                                {scan.name || 'Untitled Scan'}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${scan.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                                    scan.grade === 'B' ? 'bg-teal-100 text-teal-700' :
                                        scan.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    Grade {scan.grade}
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                    <Clock size={8} />
                                    {formatDistanceToNow(new Date(scan.created_at), { addSuffix: false }).replace('about ', '')}
                                </span>
                            </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100" />
                    </Link>
                ))}
            </div>

            <Link
                href="/history"
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
            >
                View Full History
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
        </div>
    );
}
