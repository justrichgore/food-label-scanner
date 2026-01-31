
import { createClient } from '@supabase/supabase-js';
import { ScoreDetails } from './scoring';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function saveScan(text: string, scoreDetails: ScoreDetails, frequency: string) {
    const { data, error } = await supabase.from('scans').insert([
        {
            extracted_text: text,
            score_details: scoreDetails,
            frequency,
            grade: scoreDetails.grade
        }
    ]).select();
    return { data, error };
}

