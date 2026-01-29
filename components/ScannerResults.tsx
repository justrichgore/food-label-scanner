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
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className={`${gradeBg} p-8 text-center`}>
                    <div className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">Food Safety Grade</div>
                    <div className={`text-9xl font-black ${gradeColor} leading-none`}>{grade}</div>
                    <div className="mt-4 text-2xl font-bold text-gray-800">Score: {score}/100</div>
                </div>

                {/* Statistics / Communalities */}
                <div className="p-6 bg-white">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Risk Category Breakdown</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(categoryBreakdown).length > 0 ? (
                            Object.entries(categoryBreakdown).map(([category, count]) => (
                                <div key={category} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold">{category}</div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-center text-gray-500 italic">No flagged ingredients found.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ingredient Details */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 px-2">Analyzed Ingredients</h3>

                {risks.length === 0 ? (
                    <div className="bg-green-50 p-6 rounded-2xl flex items-center justify-center text-green-800 border border-green-100">
                        <CheckCircle className="w-6 h-6 mr-2" />
                        <span>No harmful ingredients detected!</span>
                    </div>
                ) : (
                    risks.map((risk, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-lg text-gray-900 capitalize">{risk.name}</h4>
                                    <div className="text-xs font-mono text-gray-400">{risk.match} {risk.e_number ? `(${risk.e_number})` : ''}</div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${risk.tier === 'Auto-Fail' ? 'bg-red-900 text-white' :
                                        risk.tier === 'High Concern' ? 'bg-red-100 text-red-800' :
                                            risk.tier === 'Medium Concern' ? 'bg-orange-100 text-orange-800' :
                                                risk.tier === 'Low Concern' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                    }`}>
                                    {risk.penalty} pts
                                </span>
                            </div>

                            <div className="flex items-start gap-2 mt-1">
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold text-gray-800">{risk.category}:</span> {risk.notes}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <button
                onClick={onReset}
                className="w-full py-4 rounded-2xl bg-gray-900 text-white font-bold text-lg hover:bg-black transition-all active:scale-95 shadow-lg"
            >
                Scan Another Label
            </button>

        </div>
    );
}
