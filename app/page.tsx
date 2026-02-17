'use client';

import { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ScannerResults from '@/components/ScannerResults';
import { performOCR } from '@/app/actions/ocr';
import Navbar from '@/components/Navbar';
import { calculateScore, ScoreDetails, Frequency } from '@/utils/scoring';
import { saveScan } from '@/utils/supabase-legacy';


export default function Home() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [scoreData, setScoreData] = useState<ScoreDetails | null>(null);
    const [frequency, setFrequency] = useState<Frequency>('Weekly');
    const [productName, setProductName] = useState('');

    const handleImageSelect = async (file: File) => {
        if (!productName.trim()) {
            alert('Please enter a product name before scanning.');
            return;
        }

        setIsProcessing(true);
        setExtractedText(null);
        setScoreData(null);
        try {
            // 1. Upload/Process Image (Server-Side)
            const formData = new FormData();
            formData.append('file', file);

            const text = await performOCR(formData);

            if (!text) {
                alert('OCR failed to extract text. Please try again.');
                return;
            }

            setExtractedText(text);

            // 2. Calculate Score (Client-Side for now, could move to server)
            // Determine frequency based on user input or detection (default to 'daily' for now)
            // In a full app, we might ask the user "How often do you eat this?"
            const currentFrequency: Frequency = 'Daily'; // Use 'Daily' as per the new logic for saving, but keep state for UI
            const scoreDetails = calculateScore(text, currentFrequency);
            setScoreData(scoreDetails);

            // 3. Save to Supabase
            // Note: In a real app, you might want to wait for user confirmation or save automatically
            // Here we save automatically for history
            await saveScan(text, scoreDetails, currentFrequency, productName);

        } catch (error) {
            console.error("Processing failed:", error);
            alert('Something went wrong during processing.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setExtractedText(null);
        setScoreData(null);
        setFrequency('Weekly');
        setProductName('');
    };

    // Recalculate score if frequency changes
    useEffect(() => {
        if (extractedText) {
            const results = calculateScore(extractedText, frequency);
            setScoreData(results);
        }
    }, [frequency, extractedText]);

    return (
        <div className="min-h-screen pb-20 pt-8 px-6 relative z-10 w-full">
            <Navbar />

            {/* Content Container - Responsive */}
            <div className="max-w-md mx-auto md:max-w-6xl md:mx-0 md:px-8 transition-all duration-500">

                {/* Desktop Header */}
                <div className="hidden md:block mb-10">
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Welcome back, here is your activity overview.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">

                    {/* LEFT COLUMN: Scanner / Main Action */}
                    <div className="md:col-span-12 space-y-8">
                        {/* Greeting / Intro (Mobile & Desktop if state allows) */}
                        {!scoreData && !isProcessing && (
                            <div className="space-y-6 text-center md:text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="inline-block">
                                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                                        Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Smart Assistant</span> for Safer Eating
                                    </h1>
                                </div>

                                {/* Chat Bubble Effect */}
                                <div className="relative inline-block mx-auto md:mx-0">
                                    <div className="glass-card px-6 py-4 rounded-2xl rounded-bl-sm text-left max-w-xs transform transition-transform hover:-translate-y-1 duration-300">
                                        <p className="text-slate-600 font-medium">Hello! 👋</p>
                                        <p className="text-slate-500 text-sm mt-1">Scan an ingredient label, and I&apos;ll analyze it for hidden health risks instantly.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Main Action Area */}
                        <div className="relative">
                            {/* Uploader and Input */}
                            {!scoreData && (
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Product Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Morning Cereal"
                                            value={productName}
                                            onChange={(e) => setProductName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                        />
                                    </div>
                                    <ImageUploader onImageSelect={handleImageSelect} isProcessing={isProcessing} />
                                </div>
                            )}

                            {/* Results View */}
                            {scoreData && (
                                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
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

                                    <ScannerResults details={scoreData} onReset={handleReset} />

                                    {/* Debug Text */}
                                    <details className="text-xs text-slate-400 mt-8 text-center md:text-left">
                                        <summary className="cursor-pointer mb-2 hover:text-slate-600 transition-colors">View Extracted Text</summary>
                                        <p className="p-4 bg-white/50 rounded-2xl border border-white/60 whitespace-pre-wrap font-mono text-left">
                                            {extractedText}
                                        </p>
                                    </details>
                                </div>
                            )}
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
}
