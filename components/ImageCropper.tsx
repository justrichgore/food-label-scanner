import { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Camera, Check, X } from 'lucide-react';

interface ImageCropperProps {
    imageFile: File;
    onCropComplete: (croppedBlob: Blob) => void;
    onCancel: () => void;
}

// Function to center the crop initially
function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

export default function ImageCropper({ imageFile, onCropComplete, onCancel }: ImageCropperProps) {
    const [imgSrc, setImgSrc] = useState('');
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

    // Load the file as an image source
    useEffect(() => {
        setCrop(undefined); // Reset crop state when image changes
        const reader = new FileReader();
        reader.addEventListener('load', () =>
            setImgSrc(reader.result?.toString() || '')
        );
        reader.readAsDataURL(imageFile);
    }, [imageFile]);

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;

        // Start with a default crop (e.g., 80% of the image size)
        const initialCrop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 80,
                },
                1, // Default aspect ratio to trigger centerCrop, we change it immediately
                width,
                height,
            ),
            width,
            height,
        );

        // Remove aspect ratio enforcement to allow robust free-form cropping
        initialCrop.width = width * 0.8;
        initialCrop.height = height * 0.8;
        initialCrop.x = width * 0.1;
        initialCrop.y = height * 0.1;

        setCrop(initialCrop);
    }

    const handleConfirm = async () => {
        if (completedCrop?.width && completedCrop?.height && imgRef.current && completedCrop.width > 0 && completedCrop.height > 0) {

            const image = imgRef.current;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('No 2d context');
            }

            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            const pixelRatio = window.devicePixelRatio;

            canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
            canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

            ctx.scale(pixelRatio, pixelRatio);
            ctx.imageSmoothingQuality = 'high';

            const cropX = completedCrop.x * scaleX;
            const cropY = completedCrop.y * scaleY;

            ctx.translate(-cropX, -cropY);
            ctx.drawImage(
                image,
                0,
                0,
                image.naturalWidth,
                image.naturalHeight,
                0,
                0,
                image.naturalWidth,
                image.naturalHeight,
            );

            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error('Canvas is empty');
                    return;
                }
                onCropComplete(blob);
            }, imageFile.type);
        } else {
            // If no crop is made or crop is 0, just return the original file
            // Convert File to Blob
            const url = URL.createObjectURL(imageFile);
            const response = await fetch(url);
            const blob = await response.blob();
            onCropComplete(blob);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 md:p-10 border border-white/60 shadow-xl flex flex-col items-center">

                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-slate-800">Review Image</h3>
                    <p className="text-slate-500 mt-2 text-sm max-w-[300px] mx-auto">Drag the corners to crop out everything except the ingredients list for better results.</p>
                </div>

                {!!imgSrc && (
                    <div className="bg-slate-50 rounded-xl overflow-hidden shadow-inner border border-slate-200 mb-8 w-full max-h-[50vh] flex items-center justify-center">
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            className="max-h-full"
                        >
                            <img
                                ref={imgRef}
                                alt="Crop me"
                                src={imgSrc}
                                onLoad={onImageLoad}
                                className="max-h-[50vh] object-contain block mx-auto"
                            />
                        </ReactCrop>
                    </div>
                )}

                <div className="flex gap-4 w-full justify-center">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 rounded-full text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold transition-all flex items-center gap-2"
                    >
                        <X className="w-5 h-5" /> Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-3 rounded-full text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                        <Check className="w-5 h-5" /> Confirm & Scan
                    </button>
                </div>

            </div>
        </div>
    );
}
