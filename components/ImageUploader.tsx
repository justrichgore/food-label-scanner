import { useState, useRef } from 'react';
import { Upload, Camera, ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
    onImageSelect: (file: File) => void;
    isProcessing: boolean;
}

export default function ImageUploader({ onImageSelect, isProcessing }: ImageUploaderProps) {
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onImageSelect(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onImageSelect(e.target.files[0]);
            // Reset value to allow selecting the same file again (e.g., after an error)
            e.target.value = '';
        }
    };

    const triggerFileSelect = () => {
        inputRef.current?.click();
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div
                className={`relative group cursor-pointer transition-all duration-500 ease-out
            ${dragActive ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
        `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
            >
                {/* Glow Effect behind the card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-500"></div>

                <div className={`
            relative rounded-[2rem] p-10 flex flex-col items-center justify-center text-center space-y-6
            min-h-[20rem] bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl
            transition-all duration-300
            ${dragActive ? 'bg-white/90 border-emerald-400' : 'hover:border-white/80'}
            ${isProcessing ? 'cursor-wait' : ''}
        `}>

                    {isProcessing ? (
                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-20 rounded-full"></div>
                                <Loader2 className="w-16 h-16 text-emerald-600 animate-spin relative z-10" />
                            </div>
                            <p className="text-xl font-bold text-slate-800">Analyzing...</p>
                            <p className="text-sm text-slate-500">Decoding ingredients for you</p>
                        </div>
                    ) : (
                        <>
                            <div className="w-24 h-24 bg-gradient-to-tr from-emerald-100 to-teal-50 rounded-full flex items-center justify-center mb-2 group-hover:rotate-6 transition-transform duration-500 shadow-inner">
                                <Camera className="w-10 h-10 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">Scan Label</h3>
                                <p className="text-slate-500 mt-2 text-sm max-w-[200px] mx-auto">Tap to take a photo or drag & drop an image</p>
                            </div>

                            <div className="flex gap-3 mt-2">
                                <span className="px-5 py-2.5 bg-white rounded-full text-sm font-bold text-slate-600 shadow-sm border border-slate-100 flex items-center gap-2 group-hover:shadow-md transition-all">
                                    <ImageIcon className="w-4 h-4 text-emerald-500" /> Choose
                                </span>
                            </div>
                        </>
                    )}

                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleChange}
                    />
                </div>
            </div>
        </div>
    );
}
