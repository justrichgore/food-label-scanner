import { ScoreDetails, IngredientRisk } from '@/utils/scoring';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface ScannerResultsProps {
    details: ScoreDetails;
    onReset: () => void;
}

export default function ScannerResults({ details, onReset }: ScannerResultsProps) {
    const { score, grade, risks, rulePenalties, categoryBreakdown } = details;

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
            <div className="glass-card rounded-[2rem] overflow-hidden relative shadow-xl">
                <div className={`absolute top-0 left-0 w-full h-3 ${grade === 'A' ? 'bg-green-500' : grade === 'B' ? 'bg-lime-500' : grade === 'C' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <div className="p-8 text-center relative z-10 flex flex-col items-center">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Food Safety Score</div>
                    <div className="flex items-center justify-center gap-8">
                        <div className="flex flex-col items-center">
                            <div className={`text-9xl font-black ${gradeColor} drop-shadow-sm leading-none`}>{grade}</div>
                            <div className={`text-lg font-bold ${gradeColor} mt-2 uppercase tracking-wide`}>{details.meaning}</div>
                        </div>
                        <div className="text-left flex flex-col justify-center h-full pt-4">
                            <div className="text-4xl font-bold text-slate-800 leading-none">{Math.round(score)}</div>
                            <div className="text-sm text-slate-400 font-medium mt-1">out of 100</div>
                        </div>
                    </div>
                </div>

                {/* Statistics */}
                <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100">
                    {Object.keys(categoryBreakdown).length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(categoryBreakdown).map(([category, count]) => (
                                <div key={category} className="bg-white px-4 py-2.5 rounded-xl flex items-center justify-between border border-slate-100 shadow-sm">
                                    <span className="text-xs text-slate-500 font-bold uppercase truncate mr-2 tracking-wide">{category}</span>
                                    <span className="text-lg font-bold text-slate-800">{count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 text-sm py-2">No category risks detected.</div>
                    )}
                </div>
            </div>

            {/* Stack Rule Penalties */}
            {rulePenalties && rulePenalties.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Pattern Penalties</h3>
                    {rulePenalties.map((rule, idx) => (
                        <div key={idx} className="bg-orange-50/80 border border-orange-100 p-4 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                            <div>
                                <div className="flex justify-between items-center w-full">
                                    <h4 className="font-bold text-slate-800 text-sm">{rule.rule}</h4>
                                    <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">-{rule.penalty}</span>
                                </div>
                                <p className="text-xs text-slate-600 mt-1">{rule.explanation}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Ingredient Details */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 px-1 flex items-center justify-between">
                    <span>Ingredient Analysis</span>
                    <span className="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full font-medium">{risks.length} Issues Found</span>
                </h3>

                {risks.length === 0 ? (
                    <div className="glass-card p-10 rounded-2xl flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 text-green-600">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-800 mb-2">Clean Label!</h4>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">No risky ingredients found in this scan based on the V3 scoring system.</p>
                    </div>
                ) : (
                    risks.map((risk, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 transition-all hover:shadow-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-base text-slate-900 capitalize">{risk.name}</h4>
                                    <div className="text-xs font-mono text-slate-400 mt-1 flex items-center gap-2">
                                        <span>{risk.match}</span>
                                        {risk.e_number && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span>{risk.e_number}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border ${risk.tier === 'Auto-Fail' ? 'bg-red-50 text-red-600 border-red-100' :
                                        risk.tier === 'High Concern' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                            risk.tier === 'Medium Concern' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-yellow-50 text-yellow-600 border-yellow-100'
                                        }`}>
                                        -{risk.weightedPenalty} pts
                                    </span>
                                    {risk.weightedPenalty !== risk.penalty && (
                                        <span className="text-[10px] text-slate-400 font-medium">Base: -{risk.penalty}</span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    <span className="font-semibold text-slate-800 mr-1">{risk.category}:</span>
                                    {risk.notes}
                                </p>
                            </div>

                            {/* Evidence / Signals */}
                            {(risk.evidence?.percent !== undefined || risk.evidence?.position !== undefined) && (
                                <div className="flex gap-2 mt-1">
                                    {risk.evidence.percent !== undefined && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                            {risk.evidence.percent}% Content
                                        </span>
                                    )}
                                    {risk.evidence.position !== undefined && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                            Position #{risk.evidence.position}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <button
                onClick={onReset}
                className="w-full py-4 rounded-2xl primary-gradient font-bold text-lg text-white shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-300/50 transition-all active:scale-[0.98]"
            >
                Scan Another Label
            </button>

        </div>
    );
}
