import Tesseract from 'tesseract.js';

export async function processImage(file: File): Promise<string> {
    try {
        const result = await Tesseract.recognize(
            file,
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
