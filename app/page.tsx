'use client';

import { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ScannerResults from '@/components/ScannerResults';
import { processImage } from '@/utils/ocr';
import Navbar from '@/components/Navbar';
import { calculateScore, ScoreDetails, Frequency } from '@/utils/scoring';
import { saveScan } from '@/utils/supabase';

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
            await saveScan(text, results, frequency);
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
        <main className="min-h-screen pb-20 px-6 pt-12 max-w-md mx-auto relative z-10">
            <Navbar />

            <div className="space-y-8">

                {/* Greeting / Intro */}
                {!scoreDetails && !isProcessing && (
                    <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="inline-block">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Smart Assistant</span> for Safer Eating
                            </h1>
                        </div>

                        {/* Chat Bubble Effect */}
                        <div className="relative inline-block mx-auto">
                            <div className="glass-card px-6 py-4 rounded-2xl rounded-bl-sm text-left max-w-xs mx-auto transform transition-transform hover:-translate-y-1 duration-300">
                                <p className="text-slate-600 font-medium">Hello! 👋</p>
                                <p className="text-slate-500 text-sm mt-1">Scan an ingredient label, and I&apos;ll analyze it for hidden health risks instantly.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Action Area */}
                <div className="relative">
                    {/* Uploader */}
                    {!scoreDetails && (
                        <ImageUploader onImageSelect={handleImageSelect} isProcessing={isProcessing} />
                    )}

                    {/* Results View */}
                    {scoreDetails && (
                        <div className="space-y-6">
                            {/* Frequency Settings Pill */}
                            <div className="glass-card p-2 rounded-full flex items-center justify-between pl-6 pr-2">
                                <span className="text-sm font-semibold text-slate-600">Consumption:</span>
                                <div className="flex gap-1">
                                    {(['Daily', 'Weekly', 'Rare'] as Frequency[]).map((freq) => (
                                        <button
                                            key={freq}
                                            onClick={() => setFrequency(freq)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${frequency === freq
                                                ? 'bg-slate-900 text-white shadow-md'
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                                }`}
                                        >
                                            {freq}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <ScannerResults details={scoreDetails} onReset={handleReset} />

                            {/* Debug Text */}
                            <details className="text-xs text-slate-400 mt-8 text-center">
                                <summary className="cursor-pointer mb-2 hover:text-slate-600 transition-colors">View Extracted Text</summary>
                                <p className="p-4 bg-white/50 rounded-2xl border border-white/60 whitespace-pre-wrap font-mono text-left">
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
