'use client';

import { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ScannerResults from '@/components/ScannerResults';
import { processImage } from '@/utils/ocr';
import { calculateScore, ScoreDetails, Frequency } from '@/utils/scoring';
import { ShieldCheck, Info } from 'lucide-react';

export default function Home() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [scoreDetails, setScoreDetails] = useState<ScoreDetails | null>(null);
    const [frequency, setFrequency] = useState<Frequency>('Weekly');

    const handleImageSelect = async (file: File) => {
        setIsProcessing(true);
        setScoreDetails(null);
        setExtractedText(null);
        try {
            const text = await processImage(file);
            setExtractedText(text);
            // Determine initial score
            const results = calculateScore(text, frequency);
            setScoreDetails(results);
        } catch (error) {
            console.error(error);
            alert('Failed to process image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setExtractedText(null);
        setScoreDetails(null);
        setFrequency('Weekly');
    };

    // Recalculate score if frequency changes
    useEffect(() => {
        if (extractedText) {
            const results = calculateScore(extractedText, frequency);
            setScoreDetails(results);
        }
    }, [frequency, extractedText]);

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-black text-white p-2 rounded-lg">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-gray-900">LabelScanner</h1>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                        <Info className="w-6 h-6" />
                    </button>
                </div>
            </header>

            <div className="max-w-md mx-auto px-6 pt-8">

                {!scoreDetails && !isProcessing && (
                    <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Check Your Food</h2>
                        <p className="text-gray-500 text-lg">Scan ingredients to instantly expose hidden health risks and additives.</p>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="space-y-8">

                    {/* Uploader (only show if no results yet) */}
                    {!scoreDetails && (
                        <ImageUploader onImageSelect={handleImageSelect} isProcessing={isProcessing} />
                    )}

                    {/* Results View */}
                    {scoreDetails && (
                        <div className="space-y-6">

                            {/* Frequency Settings */}
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                <span className="font-semibold text-gray-700">Consumption:</span>
                                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                                    {(['Daily', 'Weekly', 'Rare'] as Frequency[]).map((freq) => (
                                        <button
                                            key={freq}
                                            onClick={() => setFrequency(freq)}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${frequency === freq
                                                    ? 'bg-white text-black shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {freq}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <ScannerResults details={scoreDetails} onReset={handleReset} />

                            {/* Debug Text (Optional, good for verifying OCR quality) */}
                            <details className="text-xs text-gray-400 mt-8">
                                <summary className="cursor-pointer mb-2">View Extracted Text</summary>
                                <p className="p-4 bg-gray-100 rounded-xl whitespace-pre-wrap font-mono">
                                    {extractedText}
                                </p>
                            </details>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
