
import { calculateScore, ScoreDetails } from '../utils/scoring';
import dictionary from '../data/dictionary.json';

const testCases = [
    {
        name: "Clean Label",
        text: "Water, Apples, Spinach",
        expectedGrade: "A",
        minScore: 90
    },
    {
        name: "Sugar in Top 3",
        text: "Sugar, Water, Apples",
        expectedRule: "Significant Penalty",
        maxScore: 75 // -10 * 2 = -20. Daily freq (1.5) = -30. Score 70.
    },
    {
        name: "Sugar in Position 4",
        text: "Water, Apples, Spinach, Sugar",
        expectedRule: "Reduced Penalty",
        // Should score higher than Top 3 case
    },
    {
        name: "Sugar High Percentage (15%)",
        text: "Water, Sugar (15%), Apples",
        expectedRule: "High Percent Penalty",
        maxScore: 50
    },
    {
        name: "Sugar Low Percentage (1%)",
        text: "Water, Apples, Sugar (1%)",
        expectedRule: "Low Percent Penalty",
        minScore: 65 // Pct mult is 1. Pos mult 2 (pos 3). -20 -> -30. Score 70.
    },
    {
        name: "UPF Stack (3+ markers)",
        text: "Water, Emulsifier, Flavouring, Stabiliser",
        expectedRuleCheck: (details: ScoreDetails) => {
            const rule = details.rulePenalties?.find(r => r.rule === 'UPF Stack (3+)' || r.rule === 'UPF Storm');
            return !!rule;
        }
    },
    {
        name: "Triad (Fat + Sugar + Refined Carb)",
        text: "Palm Oil, Sugar, Wheat Flour",
        expectedRuleCheck: (details: ScoreDetails) => {
            const rule = details.rulePenalties?.find(r => r.rule === 'Hyper-Palatable Triad');
            return !!rule;
        }
    },
    {
        name: "Multiple Oils",
        text: "Palm Oil, Sunflower Oil, Canola Oil",
        expectedRuleCheck: (details: ScoreDetails) => {
            const rule = details.rulePenalties?.find(r => r.rule === 'Multiple Oil Sources');
            return !!rule;
        }
    }
];

function runTests() {
    console.log("Starting V3 Scoring Tests...\n");
    let passed = 0;
    let failed = 0;

    testCases.forEach((test, index) => {
        console.log(`Test #${index + 1}: ${test.name}`);
        console.log(`Input: "${test.text}"`);

        try {
            const result = calculateScore(test.text, 'Daily'); // Assume Daily for most tests

            let success = true;
            let failureReason = "";

            if (test.expectedGrade && result.grade !== test.expectedGrade) {
                success = false;
                failureReason += `Expected Grade ${test.expectedGrade}, got ${result.grade}. `;
            }

            if (test.minScore && result.score < test.minScore) {
                success = false;
                failureReason += `Expected Score >= ${test.minScore}, got ${result.score}. `;
            }

            if (test.maxScore && result.score > test.maxScore) {
                success = false;
                failureReason += `Expected Score <= ${test.maxScore}, got ${result.score}. `;
            }

            if (test.expectedRuleCheck && !test.expectedRuleCheck(result)) {
                success = false;
                failureReason += `Rule check failed. `;
            }

            if (success) {
                console.log("✅ PASSED");
                passed++;
            } else {
                console.log("❌ FAILED: " + failureReason);
                console.log("Result:", JSON.stringify(result, null, 2));
                failed++;
            }

        } catch (e) {
            console.log("❌ ERROR: " + e);
            failed++;
        }
        console.log("---------------------------------------------------");
    });

    // Special Comparison Test: Position Weighting
    console.log("Test: Position Weighting Comparison");
    const top3 = calculateScore("Sugar, Water", 'Daily');
    const pos4 = calculateScore("Water, Spinach, Apples, Sugar", 'Daily');

    // Sugar in pos 1 (top3) should have higher weighted penalty than in pos 4
    // Note: score = 100 - loss. Higher penalty -> Lower score.
    if (top3.score < pos4.score) {
        console.log(`✅ PASSED: Top 3 Sugar (Score ${top3.score}) < Position 4 Sugar (Score ${pos4.score})`);
        passed++;
    } else {
        console.log(`❌ FAILED: Top 3 Sugar (${top3.score}) should be lower than Pos 4 (${pos4.score})`);
        failed++;
    }
    console.log("---------------------------------------------------");

    // Special Comparison Test: Frequency
    console.log("Test: Frequency Comparison");
    const daily = calculateScore("Sugar", 'Daily');
    const rare = calculateScore("Sugar", 'Rare');

    if (daily.score < rare.score) {
        console.log(`✅ PASSED: Daily Consumption Score (${daily.score}) < Rare Consumption Score (${rare.score})`);
        passed++;
    } else {
        console.log(`❌ FAILED: Daily (${daily.score}) should be lower than Rare (${rare.score})`);
        failed++;
    }

    console.log("\nSummary:");
    console.log(`Total: ${passed + failed}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
}

runTests();
