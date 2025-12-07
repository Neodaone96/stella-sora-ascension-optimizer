// =====================================================================
// STELLA SORA ASCENSION OPTIMIZER - CORE LOGIC (script.js)
// =====================================================================

// --- I. CORE POINT WEIGHTS (from community research) ---
const POINTS_PER_LEVEL = 60;
const POINTS_PER_NOTE = 15;
const POINTS_PER_HARMONY_LEVEL = 120; // The biggest bonus

// --- II. STARCOIN COSTS ---
// Cost to level a potential from Level N to Level N+1. Index 0 is L1->L2 cost.
const POTENTIAL_LEVEL_COSTS = [30, 60, 100, 180, 240, Infinity]; // Max level is 6

// Cost to buy Melodies (Musical Notes)
const NOTE_PACK_COST = 30; // Starcoin cost for 5 Notes
const NOTE_PACK_SIZE = 5;

// Harmony Skill requirements (Total Notes required to activate each tier)
const HARMONY_LEVEL_REQUIREMENTS = [10, 25, 40, 55, 70]; // Example tiers

// --- III. MONOLITH RESEARCH RNG RATES (Assuming MAXED) ---
const RNG_ENHANCE_BONUS = 0.30; // 30% chance for +1 bonus level on enhancement
const RNG_BONUS_PLUS_TWO = 0.30; // 30% chance for +2 levels on new acquisition (Radiant Miracle)
const RNG_BONUS_PLUS_ONE = 0.20; // 20% chance for +1 level on new acquisition (Butterflies Inside)


// --- IV. HELPER FUNCTION: Harmony Skill Checker ---

/**
 * Calculates the total points gained from Harmony Skill activations from buying notes.
 * This is crucial as it accounts for the 120-point bonus.
 * @param {object} currentHarmonyProgress - Map of noteType -> currentCount (e.g., {'Focus': 8})
 * @param {string} noteType - The type of note being purchased (e.g., 'Focus')
 * @param {number} notesToBuy - The quantity being purchased (e.g., 5)
 * @param {object[]} discHarmonySkills - A list of the skills on the player's equipped Discs.
 * @returns {number} The total points gained from Harmony Skill activations.
 */
function checkHarmonyActivation(currentHarmonyProgress, noteType, notesToBuy, discHarmonySkills) {
    let pointGain = 0;
    const currentCount = currentHarmonyProgress[noteType] || 0;
    const newCount = currentCount + notesToBuy;

    discHarmonySkills.forEach(skill => {
        // Only check skills requiring the note type being bought
        if (skill.requiredNote === noteType) {
            
            // Assume skill.level is the current *activated* level (0, 1, 2, etc.)
            const currentLevel = skill.level || 0; 

            // Check how many thresholds are crossed
            for (let i = currentLevel; i < HARMONY_LEVEL_REQUIREMENTS.length; i++) {
                const nextThreshold = HARMONY_LEVEL_REQUIREMENTS[i];
                
                // If the new total crosses the threshold and the old total didn't
                if (newCount >= nextThreshold && currentCount < nextThreshold) {
                    pointGain += POINTS_PER_HARMONY_LEVEL;
                }
            }
        }
    });

    return pointGain;
}


// --- V. CORE FUNCTION: Expected Value Calculator ---

/**
 * Calculates the Expected Value (Points / Starcoin) for a given action.
 * @param {object} action - The specific action to evaluate (e.g., {type: 'ENHANCE_POTENTIAL', potentialId: 1})
 * @param {number} starcoins - The current amount of Starcoins the player has.
 * @param {object} runData - Object containing all current run data (Potentials, Harmony, Discs).
 * @returns {number} The calculated Expected Value (EV).
 */
function calculateExpectedValue(action, starcoins, runData) {
    let cost = 0;
    let expectedPointGain = 0;

    if (action.type === 'BUY_NOTES') {
        cost = NOTE_PACK_COST;
        if (cost > starcoins) return 0;

        // 1. Deterministic points from the notes themselves
        expectedPointGain += POINTS_PER_NOTE * NOTE_PACK_SIZE;
        
        // 2. Points from Harmony Skill activations (The big boost!)
        const harmonyPoints = checkHarmonyActivation(
            runData.currentHarmonyProgress, 
            action.noteType, 
            NOTE_PACK_SIZE, 
            runData.discHarmonySkills
        );
        expectedPointGain += harmonyPoints;

    } else if (action.type === 'ENHANCE_POTENTIAL') {
        const currentLevel = runData.currentPotentials[action.potentialId] || 1; // Default to 1
        const nextCostIndex = currentLevel - 1;

        if (nextCostIndex >= POTENTIAL_LEVEL_COSTS.length - 1) return 0; // Max level reached (L6 is max)
        
        cost = POTENTIAL_LEVEL_COSTS[nextCostIndex];
        if (cost > starcoins) return 0;
        
        // 1. Base point gain (1 level = 60 points)
        let levelGain = 1;
        
        // 2. Expected bonus points from Monolith Research
        // Expected value from 30% chance for +1 level is 0.3 * 1 = 0.3 levels
        levelGain += (1 * RNG_ENHANCE_BONUS);
        
        expectedPointGain = levelGain * POINTS_PER_LEVEL;

    } else if (action.type === 'BUY_NEW_POTENTIAL') {
        // This simulates acquiring a brand new card in the shop
        cost = 100; // Example cost for a new discounted card (can be adjusted)
        if (cost > starcoins) return 0;
        
        // 1. Base point gain (1 level = 60 points)
        let levelGain = 1;

        // 2. Expected bonus points from Monolith Research (Radiant Miracle + Butterflies Inside)
        // EV: (2 levels * 30%) + (1 level * 20%) = 0.6 + 0.2 = 0.8 levels
        levelGain += (2 * RNG_BONUS_PLUS_TWO);
        levelGain += (1 * RNG_BONUS_PLUS_ONE);
        
        expectedPointGain = levelGain * POINTS_PER_LEVEL;
    }

    // Return Points/Starcoin ratio
    return cost > 0 ? expectedPointGain / cost : 0; 
}


// --- VI. EXAMPLE USAGE AND OUTPUT (Demonstrates how to use the function) ---

// Dummy data representing a player's current run state
const exampleRunData = {
    starcoins: 120,
    // Potentials: Key is ID, Value is current level (1-5)
    currentPotentials: {
        'A-AttackSpeed': 2, // Potential A is Level 2 (next cost: 100)
        'B-CritDamage': 4,  // Potential B is Level 4 (next cost: 240)
        'C-Shield': 1       // Potential C is Level 1 (next cost: 60)
    },
    // Harmony: Key is Note Type, Value is current count
    currentHarmonyProgress: {
        'Skill': 8,  // 2 notes away from L1 (10)
        'Focus': 20, // 5 notes away from L2 (25)
        'Charge': 12
    },
    // Disc Harmony Skills: What the current discs require
    discHarmonySkills: [
        { name: 'Trekker 1 Skill', requiredNote: 'Skill', level: 0 },
        { name: 'Trekker 2 Skill', requiredNote: 'Focus', level: 1 }, // Already activated L1 (10 notes)
        { name: 'Trekker 3 Skill', requiredNote: '
