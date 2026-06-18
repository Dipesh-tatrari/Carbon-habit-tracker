import { describe, it, expect } from "vitest";
import {
  calculateImpact,
  calculateCarbonSaved,
  calculatePoints,
  processHabitEntry,
  getTotalCarbonSaved,
  getTotalPoints,
  getTotalImpact,
  getBenchmarkComparison,
  formatCarbon,
  TRANSPORT_FACTORS,
  FOOD_FACTORS,
  ELECTRICITY_FACTOR,
} from "../src/utils/carbonLogic";

describe("carbonLogic.js helper functions", () => {
  describe("calculateImpact", () => {
    it("should calculate impact correctly for transport category", () => {
      expect(calculateImpact("transport", "car", 10)).toBe(2500); // 250 * 10
      expect(calculateImpact("transport", "bus", 5)).toBe(250); // 50 * 5
      expect(calculateImpact("transport", "walk", 12)).toBe(0); // 0 * 12
    });

    it("should calculate impact correctly for food category", () => {
      expect(calculateImpact("food", "beef", 1)).toBe(2500); // 2500 * 1
      expect(calculateImpact("food", "vegan", 2)).toBe(800); // 400 * 2
    });

    it("should calculate impact correctly for electricity category", () => {
      expect(calculateImpact("electricity", "", 10)).toBe(4750); // 475 * 10
    });
  });

  describe("calculateCarbonSaved", () => {
    it("should calculate savings compared to high-carbon baseline", () => {
      // transport baseline is car (250)
      // bus factor is 50. Saved = (250 - 50) * 10 = 2000
      expect(calculateCarbonSaved("transport", "bus", 10)).toBe(2000);
      // bicycle factor is 0. Saved = (250 - 0) * 10 = 2500
      expect(calculateCarbonSaved("transport", "bicycle", 10)).toBe(2500);
    });

    it("should return 0 when choice is at or above baseline", () => {
      // car choice is the baseline (250). Saved = 0
      expect(calculateCarbonSaved("transport", "car", 10)).toBe(0);
    });

    it("should return 0 for food beef (which is baseline)", () => {
      expect(calculateCarbonSaved("food", "beef", 1)).toBe(0);
    });

    it("should calculate positive savings for vegetarian food", () => {
      // food baseline is beef (2500)
      // vegetarian is 600. Saved = (2500 - 600) * 2 = 3800
      expect(calculateCarbonSaved("food", "vegetarian", 2)).toBe(3800);
    });

    it("should return 0 for electricity since baseline is the factor itself", () => {
      expect(calculateCarbonSaved("electricity", "", 10)).toBe(0);
    });
  });

  describe("calculatePoints", () => {
    it("should convert carbon saved into points correctly", () => {
      expect(calculatePoints(0)).toBe(0);
      expect(calculatePoints(-100)).toBe(0);
      expect(calculatePoints(50)).toBe(1); // 50 / 50 = 1
      expect(calculatePoints(230)).toBe(4); // floor(230 / 50) = 4
      expect(calculatePoints(2500)).toBe(50); // 2500 / 50 = 50
    });
  });

  describe("processHabitEntry", () => {
    it("should run full calculation pipeline", () => {
      const result = processHabitEntry("transport", "bus", "10");
      expect(result).toEqual({
        category: "transport",
        type: "bus",
        value: 10,
        impactG: 500, // 50 * 10
        savedG: 2000, // (250 - 50) * 10
        points: 40, // 2000 / 50
      });
    });

    it("should handle non-numeric inputs gracefully", () => {
      const result = processHabitEntry("transport", "bus", "invalid");
      expect(result.value).toBe(0);
      expect(result.impactG).toBe(0);
      expect(result.savedG).toBe(0);
      expect(result.points).toBe(0);
    });
  });

  describe("aggregations", () => {
    const sampleEntries = [
      { impactG: 500, savedG: 2000, points: 40 },
      { impactG: 600, savedG: 1900, points: 38 },
      { impactG: 1000, savedG: 0, points: 0 },
    ];

    it("should sum total carbon saved", () => {
      expect(getTotalCarbonSaved(sampleEntries)).toBe(3900);
    });

    it("should sum total points", () => {
      expect(getTotalPoints(sampleEntries)).toBe(78);
    });

    it("should sum total actual impact", () => {
      expect(getTotalImpact(sampleEntries)).toBe(2100);
    });
  });

  describe("getBenchmarkComparison", () => {
    it("should return correct benchmark breakdown", () => {
      const entries = [
        { impactG: 500, savedG: 2000 }, // baseline = 2500
        { impactG: 1000, savedG: 0 },    // baseline = 1000
      ];
      // totalImpactG = 1500, totalSavedG = 2000, totalBaseline = 3500
      // percentReduction = (2000 / 3500) * 100 = 57.14 -> 57%
      expect(getBenchmarkComparison(entries)).toEqual({
        totalImpactG: 1500,
        totalSavedG: 2000,
        totalBaselineG: 3500,
        percentReduction: 57,
      });
    });

    it("should handle empty entries list", () => {
      expect(getBenchmarkComparison([])).toEqual({
        totalImpactG: 0,
        totalSavedG: 0,
        totalBaselineG: 0,
        percentReduction: 0,
      });
    });
  });

  describe("formatCarbon", () => {
    it("should format values under 1000 as grams", () => {
      expect(formatCarbon(0)).toBe("0 g");
      expect(formatCarbon(450)).toBe("450 g");
      expect(formatCarbon(999)).toBe("999 g");
    });

    it("should format values 1000 and above as kilograms with 2 decimals", () => {
      expect(formatCarbon(1000)).toBe("1.00 kg");
      expect(formatCarbon(2350)).toBe("2.35 kg");
      expect(formatCarbon(10000)).toBe("10.00 kg");
      expect(formatCarbon(-2500)).toBe("-2.50 kg");
    });
  });
});
