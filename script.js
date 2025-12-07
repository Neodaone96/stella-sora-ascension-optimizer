// === Core Constants ===
const POINTS_PER_LEVEL = 60;
const POINTS_PER_NOTE = 15;
const POINTS_PER_HARMONY_LEVEL = 120;

const POTENTIAL_COST_CURVE = [30, 60, 100, 180, 240]; // Estimated Starcoin cost for next level
const NOTE_COST = 30; // Estimated Starcoin cost for 5 Notes
const NOTE_PACK_SIZE = 5;

// === RNG Constants for EV Calculation (if Monolith Research is maxed) ===
const RNG_BONUS_PLUS_TWO = 0.30; // 30% chance for +2 levels on new acquisition (Radiant Miracle)
const RNG_BONUS_PLUS_ONE = 0.20; // 20% chance for +1 level on new acquisition (Butterflies Inside)
const RNG_ENHANCE_BONUS = 0.30;  // 30% chance for +1 bonus level on enhancement (Potential Boost)


function calculateExpectedValue(action, starcoins, currentPotentials, currentHarmonyProgress) {
    let cost = 0;
    let expectedPointGain = 0;

    if (action.type === 'BUY_NOTES') {
        cost = NOTE_COST;
        // Deterministic points from notes themselves
        expectedPointGain = POINTS_PER_NOTE * NOTE_PACK_SIZE;

        // **Harmony Skill Check (The big bonus)**
        // Check if buying these notes will trigger a Harmony Level-Up (120 points)
        if (checkIfHarmonyLevelsUp(currentHarmonyProgress, action.noteType, NOTE_PACK_SIZE)) {
            expectedPointGain += POINTS_PER_HARMONY_LEVEL;
        }

    } else if (action.type === 'ENHANCE_POTENTIAL') {
        const potentialLevel = currentPotentials[action.potentialId];
        cost = POTENTIAL_COST_CURVE[potentialLevel - 1]; // E.g., level 1 costs 30

        // Base level gain (1 level = 60 points)
        let levelGain = 1;
        
        // Add expected points from Monolith Research bonus
        // E.g., 30% chance for +1 level means 0.3 * 60 points bonus
        levelGain += (1 * RNG_ENHANCE_BONUS);
        
        expectedPointGain = levelGain * POINTS_PER_LEVEL;

    } // ... (Other actions like BUY_NEW_CARD would go here)

    // Calculate the final efficiency ratio
    return expectedPointGain / cost; 
}
