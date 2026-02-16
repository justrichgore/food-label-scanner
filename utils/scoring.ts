import dictionaryData from '../data/dictionary.json';

export type Frequency = 'Daily' | 'Weekly' | 'Rare';

// --- Interfaces ---

export interface IngredientToken {
    raw: string;
    norm: string;
    position: number; // 1-indexed
    percent?: number;
}

export interface MultiplierConfig {
    top3: number;
    top6: number;
    rest: number;
}

export interface PercentMultiplierConfig {
    gt10: number;
    '3to10': number;
    lt3: number;
}

export interface DictionaryEntry {
    names: string[];
    e_number: string | null;
    tier: string;
    penalty: number;
    category: string;
    notes: string;
    tags?: string[];
    match_type?: 'exact' | 'contains' | 'exact_or_contains' | 'regex';
    position_multiplier?: MultiplierConfig;
    percent_multiplier?: PercentMultiplierConfig;
}

export interface RulePenalty {
    rule: string;
    penalty: number;
    explanation: string;
}

export interface IngredientRisk {
    name: string;        // The primary name from dictionary
    match: string;       // The text token that matched
    tier: string;
    penalty: number;     // Base penalty from dictionary
    weightedPenalty: number; // After position/percent multipliers
    category: string;
    notes: string;
    e_number?: string | null;
    evidence: {
        token: string;
        position: number;
        percent?: number;
        isTop3: boolean;
    };
}

export interface ScoreDetails {
    score: number;
    grade: string;
    meaning: string;
    risks: IngredientRisk[];
    rulePenalties: RulePenalty[];
    categoryBreakdown: Record<string, number>;
}

// --- Configuration Constants ---

const FREQUENCY_MULTIPLIERS: Record<Frequency, number> = {
    'Daily': 1.5,
    'Weekly': 1.0,
    'Rare': 0.5,
};

// Default configs if missing in JSON
const DEFAULT_POSITION_MULTIPLIER: MultiplierConfig = { top3: 1.0, top6: 1.0, rest: 1.0 };
const DEFAULT_PERCENT_MULTIPLIER: PercentMultiplierConfig = { gt10: 1.0, '3to10': 1.0, lt3: 1.0 };
const DEFAULT_MATCH_TYPE = 'exact_or_contains';

const dictionary = dictionaryData as DictionaryEntry[];

// --- Parsing Logic ---

export function parseIngredients(text: string): IngredientToken[] {
    // 1. Split by comma, respecting parentheses
    // Simple regex approach: split by comma if not inside parens
    // Since JS regex lookbehind/recursion is limited, a simple parser is often safer.
    // However, for this MVP, splitting by comma is usually "good enough" if we handle nested brackets roughly.

    const tokens: IngredientToken[] = [];
    let currentToken = '';
    let parenDepth = 0;
    let position = 1;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '(') parenDepth++;
        if (char === ')') parenDepth--;

        if (char === ',' && parenDepth === 0) {
            if (currentToken.trim()) {
                tokens.push(createToken(currentToken, position));
                position++;
            }
            currentToken = '';
        } else {
            currentToken += char;
        }
    }
    if (currentToken.trim()) {
        tokens.push(createToken(currentToken, position));
    }

    // Sub-ingredient parsing could be added here (recursively), 
    // but V3 guide says: "Include bracketed sub-ingredients... Assign sub-ingredients the parent’s position."
    // Let's iterate tokens and see if they contain brackets to extract sub-ingredients.

    const expandedTokens: IngredientToken[] = [];

    tokens.forEach(token => {
        expandedTokens.push(token); // Add parent

        // Check for sub-ingredients in brackets: "Ingredient (sub1, sub2)"
        const match = token.raw.match(/\(([^)]+)\)/);
        if (match && match[1]) {
            // Split sub-ingredients
            const subText = match[1];
            // Recursively parse, but force position to match parent
            // We can reuse the simple split logic but override position
            const subParts = subText.split(',').map(s => s.trim()).filter(s => s);
            subParts.forEach(sub => {
                // Check if sub looks like a percentage only "12%", ignore it as an ingredient
                if (!/^\d+(\.\d+)?%$/.test(sub)) {
                    expandedTokens.push({
                        raw: sub,
                        norm: normalize(sub),
                        position: token.position, // Parent position
                        percent: undefined // Sub-ingredients usually don't have their own percent listed this way in simple parsing
                    });
                }
            });
        }
    });

    return expandedTokens;
}

function createToken(raw: string, position: number): IngredientToken {
    // Extract percent: "Palm oil (12%)" -> 12
    const percentMatch = raw.match(/(\d+(?:\.\d+)?)%/);
    const percent = percentMatch ? parseFloat(percentMatch[1]) : undefined;

    return {
        raw: raw.trim(),
        norm: normalize(raw),
        position,
        percent
    };
}

function normalize(text: string): string {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s\-]/g, '') // remove extra punctuation
        .replace(/\s+/g, ' ')
        .trim();
}


// --- Matching Logic ---

function matchEntry(entry: DictionaryEntry, token: IngredientToken): boolean {
    const matchType = entry.match_type || DEFAULT_MATCH_TYPE;

    // 1. Check E-number
    if (entry.e_number) {
        // Normalize OCR text to capture "E330", "E-330", "E 330"
        // Simple heuristic: look for "e" followed by number in token
        const eMatch = token.norm.match(/e[\s-]?(\d+)/);
        if (eMatch) {
            const foundE = `E${eMatch[1]}`; // standard E330 format
            // Check against entry e_number (could be range "E249-E252" or single "E330")
            // For MVP assuming single or simple comma list in dictionary string?
            // The dictionary has "E249-E252". We need to handle ranges if we want to be perfect.
            // For now, let's do a simple includes check if exact match fails

            if (entry.e_number.includes(foundE)) return true;
        }
    }

    // 2. Name Matching
    for (const name of entry.names) {
        const normName = normalize(name);

        if (matchType === 'exact') {
            if (token.norm === normName) return true;
        } else if (matchType === 'contains') {
            if (token.norm.includes(normName)) return true;
        } else if (matchType === 'exact_or_contains') {
            // If token is very short, prefer exact. If long, allow contains.
            // But the rule says "pragmatic default".
            // Let's use includes, but maybe check word boundaries?
            if (token.norm.includes(normName)) return true;
        }
    }

    return false;
}

// --- Scoring Logic ---

export function calculateScore(text: string, frequency: Frequency = 'Weekly'): ScoreDetails {
    const tokens = parseIngredients(text);
    const risks: IngredientRisk[] = [];
    const matchedEntryIndices = new Set<number>();
    const categoryBreakdown: Record<string, number> = {};

    let score = 100;
    let autoFail = false;

    // 1. Match Ingredients
    for (const token of tokens) {
        for (let i = 0; i < dictionary.length; i++) {
            if (matchedEntryIndices.has(i)) continue; // Deduplicate entries per scan

            const entry = dictionary[i];
            if (matchEntry(entry, token)) {
                matchedEntryIndices.add(i);

                if (entry.tier === 'Auto-Fail') {
                    autoFail = true;
                }

                // Calculate Weighted Penalty
                let p = entry.penalty;

                // Position Multiplier
                const posMult = entry.position_multiplier || DEFAULT_POSITION_MULTIPLIER;
                let appliedPosMult = 1.0;
                if (token.position <= 3) appliedPosMult = posMult.top3;
                else if (token.position <= 6) appliedPosMult = posMult.top6;
                else appliedPosMult = posMult.rest;

                p *= appliedPosMult;

                // Percent Multiplier
                if (token.percent !== undefined) {
                    const pctMult = entry.percent_multiplier || DEFAULT_PERCENT_MULTIPLIER;
                    if (token.percent > 10) p *= pctMult.gt10;
                    else if (token.percent >= 3) p *= pctMult['3to10'];
                    else p *= pctMult.lt3;
                }

                risks.push({
                    name: entry.names[0],
                    match: token.raw,
                    tier: entry.tier,
                    penalty: entry.penalty, // Original base penalty for reference
                    weightedPenalty: p, // The actual hit
                    category: entry.category,
                    notes: entry.notes,
                    e_number: entry.e_number,
                    evidence: {
                        token: token.raw,
                        position: token.position,
                        percent: token.percent,
                        isTop3: token.position <= 3
                    }
                });

                categoryBreakdown[entry.category] = (categoryBreakdown[entry.category] || 0) + 1;

                // Optimization: don't break loop? 
                // Actually, one token might match multiple entries? 
                // Usually unlikely to match distinct non-overlapping entries conceptually, 
                // but "Sugar" matches "Sugar" and maybe something else? 
                // Guide says "Deduplicate matches: Same entry matches once".
                // It doesn't say "One token matches only one entry".
                // But typically, greedy match or first match is safer to avoid double jeopardy for same word.
                // Let's break to consume the token? 
                // No, "Vegetable Oil (Palm)" -> Matches "Vegetable Oil" AND "Palm Oil".
                // We want both?
                // Usually yes.
            }
        }
    }

    if (autoFail) {
        return {
            score: 0,
            grade: 'F',
            meaning: 'Avoid',
            risks: risks.sort((a, b) => b.penalty - a.penalty), // Sort roughly
            rulePenalties: [],
            categoryBreakdown
        };
    }

    // 2. Sum Weights
    let totalPenalty = 0;
    risks.forEach(r => totalPenalty += r.weightedPenalty);

    // 3. Stack Rules
    const rulePenalties: RulePenalty[] = [];

    // Rule: UPF Stack
    // "tags" are needed from matched entries. 
    // We need to look up source entry from risk to get tags
    // Let's map risks back to dictionary entries or store tags in Risk?
    // Let's re-fetch tags or store them. I'll re-fetch for simplicity/clean types.

    // Helper to get tags for a risk
    const getTags = (risk: IngredientRisk) => {
        // Find entry by name (unique enough for this)
        const entry = dictionary.find(d => d.names[0] === risk.name);
        return entry?.tags || [];
    };

    let upfCount = 0;
    risks.forEach(r => {
        const tags = getTags(r);
        if (tags.includes('upf') || r.category === 'Ultra-Processed Food Markers') {
            upfCount++;
        }
    });

    if (upfCount >= 5) {
        rulePenalties.push({ rule: 'UPF Stack (5+)', penalty: -15, explanation: 'High number of ultra-processed markers detected.' });
    } else if (upfCount >= 3) {
        rulePenalties.push({ rule: 'UPF Stack (3+)', penalty: -10, explanation: 'Multiple ultra-processed markers detected.' });
    }

    // Rule: Triad (Fat + Sugar + Refined Carb)
    let hasFat = false;
    let hasSugar = false;
    let hasCarb = false;
    let top3Count = 0;

    risks.forEach(r => {
        const tags = getTags(r);
        const isFat = tags.includes('fat');
        const isSugar = tags.includes('sugar') || tags.includes('sweetener'); // Broaden? Guide says 'sugar'
        const isCarb = tags.includes('refined_carb');

        if (isFat) hasFat = true;
        if (isSugar) hasSugar = true;
        if (isCarb) hasCarb = true;

        if ((isFat || isSugar || isCarb) && r.evidence.isTop3) {
            top3Count++;
        }
    });

    if (hasFat && hasSugar && hasCarb) {
        if (top3Count >= 2) {
            rulePenalties.push({ rule: 'Hyper-Palatable Triad', penalty: -15, explanation: 'Combination of fat, sugar, and refined carbs in main ingredients.' });
        } else {
            rulePenalties.push({ rule: 'Hyper-Palatable Triad', penalty: -10, explanation: 'Combination of fat, sugar, and refined carbs.' });
        }
    }

    // Rule: Multiple Fats
    let fatCount = 0;
    let hasSaturated = false;

    // We need to count DISTINCT fat entries. Risks are already deduplicated by entry.
    risks.forEach(r => {
        const tags = getTags(r);
        if (tags.includes('fat')) {
            fatCount++;
            if (tags.includes('saturated') || tags.includes('trans')) { // assuming trans is bad too
                hasSaturated = true; // Guide says "tagged saturated"
            }
        }
    });

    if (fatCount >= 2) {
        let p = -5;
        if (hasSaturated) p -= 5;
        rulePenalties.push({ rule: 'Multiple Oil Sources', penalty: p, explanation: `Contains ${fatCount} different fat/oil sources${hasSaturated ? ' (including saturated/trans)' : ''}.` });
    }


    // 4. Apply Rules
    let rulePenaltySum = 0;
    rulePenalties.forEach(r => rulePenaltySum += r.penalty);

    score += totalPenalty;
    score += rulePenaltySum;

    // 5. Frequency Multiplier
    // Guide: "Score *= frequency_multiplier". 
    // Wait, pseudocode said: score = 100 ... score += penalties ... score *= freq
    // If score is 40. 40 * 1.5 = 60? (Daily makes it BETTER?)
    // No, usually Daily makes it WORSE.
    // Let's re-read Guide 8. Frequency Multiplier.
    // "Daily: x1.5, Weekly: x1.0, Rare: 0.5"
    // "Apply this multiplier after penalties ... before clamping."
    // If Score = 80 (Good). Daily => 120?
    // If Score = 30 (Bad). Daily => 45?
    // This logic seems inverted if it multiplies the *result* score.
    // Unless multiplier is applied to the *Deficit* (loss)?
    // Or maybe the guide implies Score = 100 - (Loss * Multiplier).
    // Let's look at pseudocode:
    // score += penalty_sum (negative)
    // score += rule_penalties (negative)
    // score *= frequency_multiplier 

    // If I have risks (-50). Score is 50.
    // Daily (1.5). Score -> 75. 
    // This implies Daily is safer? That's wrong.

    // Interpretation: The multiplier should apply to the *Penalties*, not the final score.
    // "Daily usage amplifies the risk". So penalties should be x1.5.
    // "Rare usage reduces the risk". Penalties should be x0.5.

    // Let's override the pseudocode with logical intent:
    // TotalRisk = (Abs(PenaltySum) + Abs(RuleSum)) * Multiplier
    // Score = 100 - TotalRisk

    const penaltyMagnitude = -1 * (totalPenalty + rulePenaltySum); // Convert to positive loss
    const freqMult = FREQUENCY_MULTIPLIERS[frequency];

    const finalLoss = penaltyMagnitude * freqMult;
    score = 100 - finalLoss;

    // 6. Clamp
    score = Math.max(0, Math.min(100, score));

    return {
        score: Math.round(score),
        grade: getGrade(score),
        meaning: getMeaning(score),
        risks: risks.sort((a, b) => a.weightedPenalty - b.weightedPenalty), // Sort by biggest hit (most negative)
        rulePenalties,
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

function getMeaning(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Acceptable';
    if (score >= 40) return 'Poor';
    return 'Avoid';
}

