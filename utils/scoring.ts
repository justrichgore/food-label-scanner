import dictionaryData from '../data/dictionary.json';

export type Frequency = 'Daily' | 'Weekly' | 'Rare';

export interface IngredientRisk {
  name: string;
  match: string; // The text that matched
  tier: string;
  penalty: number;
  category: string;
  notes: string;
  e_number?: string | null;
}

export interface ScoreDetails {
  score: number;
  grade: string;
  risks: IngredientRisk[];
  categoryBreakdown: Record<string, number>; // Category name -> count
}

const FREQUENCY_MULTIPLIERS: Record<Frequency, number> = {
  'Daily': 1.5,
  'Weekly': 1.0,
  'Rare': 0.5,
};

// Flatten dictionary for easier lookup
// We will search by E-number and by name (lower case)
interface DictionaryEntry {
    names: string[];
    e_number: string | null;
    tier: string;
    penalty: number;
    category: string;
    notes: string;
}

const dictionary = dictionaryData as DictionaryEntry[];

export function calculateScore(text: string, frequency: Frequency = 'Weekly'): ScoreDetails {
  let score = 100;
  const risks: IngredientRisk[] = [];
  const categoryBreakdown: Record<string, number> = {};

  // Normalize text: lowercase, remove special chars except commas/brackets which might separate ingredients
  // actually, for safety, let's keep it simple first
  const normalizedText = text.toLowerCase();
  
  // We need to identify ingredients. This is tricky with simple string matching.
  // Strategy: 
  // 1. Iterate through every dictionary entry.
  // 2. Check if any of its names or E-number appear in the text.
  // 3. If match, add to risks.
  // 4. Handle duplicates? The guide says "Deduplicate identical matches".
  //    This implies if "E102" and "Tartrazine" both appear, count once.
  
  // Improvement: Tokenize by comma?
  // Many labels are comma separated lists.
  // Let's try matching against the wholestring first, simplistic but robust for basic OCR.

  const foundIngredients = new Set<string>(); // Set of matching dictionary indices to avoid double counting same entry

  dictionary.forEach((entry, index) => {
    let matchFound = false;
    let matchTerm = '';

    // Check E-number
    if (entry.e_number && normalizedText.includes(entry.e_number.toLowerCase())) {
        matchFound = true;
        matchTerm = entry.e_number;
    }

    // Check Matches
    if (!matchFound) {
        for (const name of entry.names) {
            if (normalizedText.includes(name.toLowerCase())) {
                matchFound = true;
                matchTerm = name;
                break;
            }
        }
    }

    if (matchFound && !foundIngredients.has(index.toString())) {
        foundIngredients.add(index.toString());
        
        // Auto-fail check
        if (entry.tier === 'Auto-Fail') {
            score = 0;
            // We can stop or continue to collect all risks? 
            // Guide says "Return score = 0 immediately". 
            // But user might want to know WHY. So let's continue collecting risks but force score 0 at end.
        }

        risks.push({
            name: entry.names[0],
            match: matchTerm,
            tier: entry.tier,
            penalty: entry.penalty,
            category: entry.category,
            notes: entry.notes,
            e_number: entry.e_number
        });

        // Update category breakdown
        categoryBreakdown[entry.category] = (categoryBreakdown[entry.category] || 0) + 1;
    }
  });

  // Calculate Score
  let totalPenalty = 0;
  let autoFail = false;

  for (const risk of risks) {
      if (risk.tier === 'Auto-Fail') {
          autoFail = true;
      }
      totalPenalty += risk.penalty;
  }

  // Apply multiplier to penalty or to the reduction?
  // Guide: "6) Apply frequency multiplier." -> Usually applies to the penalty deduction?
  // "Subtract penalties... Apply frequency multiplier... Clamp final score"
  // If score starts at 100, and unmatched penalties = -20.
  // Multiplier 1.5 -> penalty -30? Or (100-20)*1.5?
  // Usually penalties are scaled. Let's assume penalties are scaled.
  
  // Wait, if penalty is negative number (e.g. -25), totalPenalty is negative.
  // So Score = 100 + (totalPenalty * multiplier)
  
  const multiplier = FREQUENCY_MULTIPLIERS[frequency];
  
  if (autoFail) {
      score = 0;
  } else {
      const adjustedPenalty = totalPenalty * multiplier;
      score = 100 + adjustedPenalty; // totalPenalty is negative
      score = Math.max(0, Math.min(100, score)); // Clamp 0-100
  }

  return {
    score: Math.round(score),
    grade: getGrade(score),
    risks: risks.sort((a, b) => a.penalty - b.penalty), // Sort by highest penalty (most negative)
    categoryBreakdown
  };
}

function getGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
}
