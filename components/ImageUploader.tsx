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
        }
    };

    const triggerFileSelect = () => {
        inputRef.current?.click();
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div
                className={`relative group cursor-pointer transition-all duration-300 ease-in-out
            ${dragActive ? 'scale-105' : 'scale-100'}
        `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
            >
                <div className={`
            border-4 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4
            h-80 bg-white shadow-sm hover:shadow-md transition-all
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}>

                    {isProcessing ? (
                        <>
                            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                            <p className="text-xl font-bold text-gray-600">Scanning ingredients...</p>
                            <p className="text-sm text-gray-400">Extracting text & analyzing risks</p>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Camera className="w-10 h-10 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Scan Food Label</h3>
                                <p className="text-gray-500 mt-2">Take a photo or upload an image of the ingredients list.</p>
                            </div>
                            <div className="flex gap-4 mt-4">
                                <span className="px-4 py-2 bg-gray-100 rounded-full text-sm font-semibold text-gray-600 flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" /> Upload
                                </span>
                                <span className="px-4 py-2 bg-gray-100 rounded-full text-sm font-semibold text-gray-600 flex items-center gap-2">
                                    <Camera className="w-4 h-4" /> Camera
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
                        capture="environment" // Hints mobile browsers to use the camera
                    />
                </div>
            </div>
        </div>
    );
}
