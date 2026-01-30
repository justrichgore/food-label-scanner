import { ScoreDetails, IngredientRisk } from '@/utils/scoring';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface ScannerResultsProps {
    details: ScoreDetails;
    onReset: () => void;
}

export default function ScannerResults({ details, onReset }: ScannerResultsProps) {
    const { score, grade, risks, categoryBreakdown } = details;

    // Determine color based on grade
    const gradeColor =
        grade === 'A' ? 'text-green-600' :
            grade === 'B' ? 'text-lime-600' :
                grade === 'C' ? 'text-yellow-600' :
                    grade === 'D' ? 'text-orange-600' :
                        'text-red-600';

    const gradeBg =
        grade === 'A' ? 'bg-green-100' :
            grade === 'B' ? 'bg-lime-100' :
                grade === 'C' ? 'bg-yellow-100' :
                    grade === 'D' ? 'bg-orange-100' :
                        'bg-red-100';

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Score Card */}
            <div className="glass-card rounded-[2rem] overflow-hidden relative">
                <div className={`absolute top-0 left-0 w-full h-2 ${grade === 'A' ? 'bg-green-500' : grade === 'B' ? 'bg-lime-500' : grade === 'C' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <div className="p-8 text-center relative z-10">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Food Safety Score</div>
                    <div className="flex items-center justify-center gap-6">
                        <div className={`text-8xl font-black ${gradeColor} drop-shadow-sm`}>{grade}</div>
                        <div className="text-left">
                            <div className="text-3xl font-bold text-slate-800">{score}</div>
                            <div className="text-sm text-slate-400 font-medium">out of 100</div>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="px-6 py-4 bg-white/40 border-t border-white/60">
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(categoryBreakdown).length > 0 ? (
                            Object.entries(categoryBreakdown).map(([category, count]) => (
                                <div key={category} className="bg-white/50 px-4 py-2 rounded-xl flex items-center justify-between border border-white/40">
                                    <span className="text-xs text-slate-500 font-semibold uppercase truncate mr-2">{category}</span>
                                    <span className="text-lg font-bold text-slate-800">{count}</span>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-center text-slate-400 text-sm py-2">No main risks detected.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ingredient Details */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 px-4 flex items-center gap-2">
                    Analysis Report
                    <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full">{risks.length} Items</span>
                </h3>

                {risks.length === 0 ? (
                    <div className="glass-card p-8 rounded-2xl flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-800">Clean Label!</h4>
                        <p className="text-slate-500 mt-2 text-sm">No risky ingredients found in this scan.</p>
                    </div>
                ) : (
                    risks.map((risk, idx) => (
                        <div key={idx} className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-white/60 flex flex-col gap-3 transition-transform hover:scale-[1.01]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-base text-slate-900 capitalize">{risk.name}</h4>
                                    <div className="text-xs font-mono text-slate-400 mt-0.5">{risk.match} {risk.e_number ? `• ${risk.e_number}` : ''}</div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${risk.tier === 'Auto-Fail' ? 'bg-red-50 text-red-600 border-red-100' :
                                        risk.tier === 'High Concern' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                            risk.tier === 'Medium Concern' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-yellow-50 text-yellow-600 border-yellow-100'
                                    }`}>
                                    {risk.penalty} pts
                                </span>
                            </div>

                            <div className="flex items-start gap-3 bg-slate-50/50 p-3 rounded-xl">
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    <span className="font-semibold text-slate-800">{risk.category}:</span> {risk.notes}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button
                onClick={onReset}
                className="w-full py-4 rounded-2xl primary-gradient font-bold text-lg text-white shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transition-all active:scale-[0.98]"
            >
                Scan Another Label
            </button>

        </div>
    );
}
