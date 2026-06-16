/**
 * carbonLogic.js
 * ---------------
 * Pure, stateless helper functions for converting logged habits into
 * carbon impact (grams of CO2) and Eco-points. Nothing here touches
 * React, Context, or localStorage — every function takes plain
 * arguments and returns a plain value, so it's easy to unit test and
 * easy to reuse from any component.
 *
 * UNITS: all emission values are in grams of CO2 ("g CO2").
 */

// ---------------------------------------------------------------------
// 1. EMISSION FACTORS
// ---------------------------------------------------------------------
// gCO2 emitted per ONE unit of each habit.
export const TRANSPORT_FACTORS = {
  car: 250,     // g CO2 per km
  bus: 50,      // g CO2 per km
  train: 40,    // g CO2 per km
  bicycle: 0,   // g CO2 per km
  walk: 0,      // g CO2 per km
};

export const FOOD_FACTORS = {
  beef: 2500,        // g CO2 per meal
  chicken: 1000,     // g CO2 per meal
  vegetarian: 600,   // g CO2 per meal
  vegan: 400,        // g CO2 per meal
};

export const ELECTRICITY_FACTOR = 475; // g CO2 per kWh

// The "high-carbon baseline" per category — i.e. the worst choice a
// user could make. Used to calculate how much CO2 a greener choice saves.
export const HIGH_CARBON_BASELINES = {
  transport: TRANSPORT_FACTORS.car,
  food: FOOD_FACTORS.beef,
  electricity: ELECTRICITY_FACTOR,
};

// Every POINTS_DIVISOR grams of CO2 saved = 1 Eco-point.
export const POINTS_DIVISOR = 50;

// ---------------------------------------------------------------------
// 2. CALCULATION ENGINE
// ---------------------------------------------------------------------

/**
 * Calculate the carbon impact (g CO2) of a single habit entry.
 *
 *   impact = emissionFactor (g CO2 per unit) x value (units)
 *
 * @param {"transport"|"food"|"electricity"} category
 * @param {string} type   - e.g. "car", "beef", or "" for electricity
 * @param {number} value  - km, meals, or kWh
 * @returns {number} impact in grams of CO2, rounded to 2 decimals
 */
export function calculateImpact(category, type, value) {
  const factor = getEmissionFactor(category, type);
  return round2(factor * value);
}

/**
 * Calculate how much CO2 (g) was saved by choosing `type` instead of
 * the high-carbon baseline for the same category and quantity.
 *
 *   saved = baselineFactor x value - actualFactor x value
 *
 * Returns 0 (never negative) if the choice was at-or-above the baseline,
 * so users never lose points for a "worse" choice.
 */
export function calculateCarbonSaved(category, type, value) {
  const baselineFactor = HIGH_CARBON_BASELINES[category];
  const actualFactor = getEmissionFactor(category, type);

  const saved = (baselineFactor - actualFactor) * value;
  return round2(Math.max(saved, 0));
}

/**
 * Convert grams of CO2 saved into Eco-points.
 *
 *   points = floor(carbonSaved / POINTS_DIVISOR)
 *
 * e.g. 250g saved -> floor(250 / 50) = 5 points
 */
export function calculatePoints(carbonSaved) {
  if (carbonSaved <= 0) return 0;
  return Math.floor(carbonSaved / POINTS_DIVISOR);
}

/**
 * Run the full pipeline for one habit entry: impact, CO2 saved, and
 * points earned. This is the single function components call when a
 * user submits the log form.
 *
 * @returns {{ category, type, value, impactG, savedG, points }}
 */
export function processHabitEntry(category, type, value) {
  const numericValue = Number(value) || 0;
  const impactG = calculateImpact(category, type, numericValue);
  const savedG = calculateCarbonSaved(category, type, numericValue);
  const points = calculatePoints(savedG);

  return {
    category,
    type,
    value: numericValue,
    impactG,
    savedG,
    points,
  };
}

/**
 * Sum the total CO2 saved (g) across an array of habit entries
 * (each entry must have a `savedG` field, as produced by
 * processHabitEntry).
 */
export function getTotalCarbonSaved(entries) {
  return round2(entries.reduce((sum, entry) => sum + (entry.savedG || 0), 0));
}

/**
 * Sum the total Eco-points across an array of habit entries.
 */
export function getTotalPoints(entries) {
  return entries.reduce((sum, entry) => sum + (entry.points || 0), 0);
}

/**
 * Sum the actual CO2 impact (g) across an array of habit entries
 * (each entry must have an `impactG` field, as produced by
 * processHabitEntry).
 */
export function getTotalImpact(entries) {
  return round2(entries.reduce((sum, entry) => sum + (entry.impactG || 0), 0));
}

/**
 * Compare the user's logged choices against the "high-carbon baseline"
 * for those same activities — i.e. what their footprint WOULD have been
 * if they'd made the worst choice every time.
 *
 * THE MATH:
 *   For any entry:  baselineImpact = actualImpact + savedG
 *   (since savedG = baselineFactor*value - actualFactor*value)
 *
 *   percentReduction = totalSaved / totalBaseline x 100
 *
 * Example: if your total impact is 1500g and you saved 1500g vs.
 * baseline, your baseline would have been 3000g — you're emitting 50%
 * less than "the average commuter" for these same activities.
 *
 * @param {Array} entries - habit entries (impactG + savedG)
 * @returns {{ totalImpactG: number, totalSavedG: number, totalBaselineG: number, percentReduction: number }}
 */
export function getBenchmarkComparison(entries) {
  const totalImpactG = getTotalImpact(entries);
  const totalSavedG = getTotalCarbonSaved(entries);
  const totalBaselineG = totalImpactG + totalSavedG;

  const percentReduction = totalBaselineG > 0 ? (totalSavedG / totalBaselineG) * 100 : 0;

  return {
    totalImpactG,
    totalSavedG,
    totalBaselineG,
    percentReduction: Math.round(percentReduction),
  };
}

// ---------------------------------------------------------------------
// 3. DISPLAY HELPERS
// ---------------------------------------------------------------------

/**
 * Format a gram value for display, switching to kg above 1000g.
 *   850   -> "850 g"
 *   2300  -> "2.30 kg"
 */
export function formatCarbon(grams) {
  if (Math.abs(grams) >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`;
  }
  return `${Math.round(grams)} g`;
}

// ---------------------------------------------------------------------
// INTERNAL HELPERS
// ---------------------------------------------------------------------

function getEmissionFactor(category, type) {
  if (category === "transport") return TRANSPORT_FACTORS[type] ?? 0;
  if (category === "food") return FOOD_FACTORS[type] ?? 0;
  if (category === "electricity") return ELECTRICITY_FACTOR;
  throw new Error(`Unknown category: "${category}"`);
}

function round2(num) {
  return Math.round(num * 100) / 100;
}
