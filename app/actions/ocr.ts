'use server';

import { ImageAnnotatorClient } from '@google-cloud/vision';

export async function performOCR(formData: FormData): Promise<string> {
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
        throw new Error('No file provided');
    }

    try {
        const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        if (!credentialsJson) {
            throw new Error('Missing Google Cloud credentials');
        }

        const credentials = JSON.parse(credentialsJson);

        const client = new ImageAnnotatorClient({
            credentials,
        });

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const [result] = await client.textDetection(buffer);
        const detections = result.textAnnotations;

        if (!detections || detections.length === 0) {
            return '';
        }

        const fullText = detections[0].description || '';
        const ingredientsOnly = extractIngredients(fullText);

        return ingredientsOnly;
    } catch (error: any) {
        console.error('Google Vision OCR Error Detail:', JSON.stringify(error, null, 2));
        console.error('Google Vision OCR Error Message:', error.message);
        throw new Error(`Failed to process image: ${error.message}`);
    }
}

function extractIngredients(text: string): string {
    // Regex to find "Ingredients" optionally followed by ":"
    // Case insensitive, looks for the keyword
    const match = text.match(/ingredients\s*:?/i);

    if (match && match.index !== undefined) {
        // Return everything after the match
        // match[0] includes "Ingredients" or "Ingredients:"
        return text.substring(match.index + match[0].length).trim();
    }

    // Fallback: Return original text if keyword not found
    return text;
}
