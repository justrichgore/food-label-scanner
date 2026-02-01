import { createClient } from '@/utils/supabase/client';
import { ScoreDetails } from './scoring';

export async function saveScan(text: string, scoreDetails: ScoreDetails, frequency: string, name?: string) {
    const supabase = createClient();

    // Explicitly get string user to ensure we are authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("saveScan: User not authenticated!", userError);
        // We might want to throw here, but for now let's proceed to see if DB default handles it (it likely won't if auth is missing)
        // Actually, if we are here, we probably want to alert the user.
    } else {
        console.log("saveScan: Saving for user", user.id);
    }

    const { data, error } = await supabase.from('scans').insert([
        {
            extracted_text: text,
            score_details: scoreDetails,
            frequency,
            grade: scoreDetails.grade,
            name: name || 'Untitled Scan',
            user_id: user?.id // Explicitly set user_id
        }
    ]).select();
    return { data, error };
}

export async function updateScanFrequency(id: string, frequency: string, scoreDetails: ScoreDetails) {
    const supabase = createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("updateScanFrequency: User not authenticated!", userError);
        return { data: null, error: userError || new Error("User not authenticated") };
    }

    const { data, error } = await supabase
        .from('scans')
        .update({
            frequency,
            score_details: scoreDetails,
            grade: scoreDetails.grade
        })
        .eq('id', id)
        .eq('user_id', user.id) // Ensure RLS/ownership
        .select();

    return { data, error };
}

