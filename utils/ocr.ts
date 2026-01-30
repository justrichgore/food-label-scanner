import Tesseract from 'tesseract.js';

/**
 * Pre-processes the image to improve OCR accuracy.
 * Steps:
 * 1. Rescale to a reasonable size (improves speed/accuracy for large photos).
 * 2. Convert to Grayscale.
 * 3. Increase Contrast / Binarize (create stark black/white difference).
 */
async function preprocessImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(url);
                return resolve(url); // Fallback to original if no context
            }

            // 1. Resize if too large (e.g., > 2000px width). 
            // Tesseract works well with ~300 DPI. Phone photos are huge.
            // A width of ~1500-2000 is usually a sweet spot for labels.
            const MAX_WIDTH = 2000;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height = Math.round(height * (MAX_WIDTH / width));
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;

            // Draw image
            ctx.drawImage(img, 0, 0, width, height);

            // Get raw pixel data
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            // 2. Grayscale & Binarization (Thresholding)
            // Iterate pixels (R, G, B, A)
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Luminosity formula for grayscale
                const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;

                // Simple Binarization (Thresholding)
                // If lighter than threshold, make white. Else make black.
                // Threshold of 128 is standard, maybe 140 for slightly better background removal on labels?
                const threshold = 145; // Tuned slightly higher to wash out shadows

                const val = gray > threshold ? 255 : 0;

                data[i] = val;
                data[i + 1] = val;
                data[i + 2] = val;
            }

            // Put data back
            ctx.putImageData(imageData, 0, 0);

            // Export
            const processedDataUrl = canvas.toDataURL('image/jpeg', 0.9); // JPEG is faster
            URL.revokeObjectURL(url);

            resolve(processedDataUrl);
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };

        img.src = url;
    });
}

export async function processImage(file: File): Promise<string> {
    try {
        // Run pre-processing
        const processedImage = await preprocessImage(file);

        const result = await Tesseract.recognize(
            processedImage,
            'eng',
            {
                logger: _m => { } // Silent logger
            }
        );

        return result.data.text;
    } catch (error) {
        console.error("OCR Error:", error);
        throw new Error("Failed to process image.");
    }
}
