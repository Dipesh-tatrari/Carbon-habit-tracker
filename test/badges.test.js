import { describe, it, expect } from "vitest";
import { getLevel, checkNewBadges, LEVELS, BADGES } from "../src/utils/badges";

describe("badges.js gamification functions", () => {
  describe("getLevel", () => {
    it("should return Seedling for 0 points", () => {
      const result = getLevel(0);
      expect(result.current.name).toBe("Seedling");
      expect(result.currentIndex).toBe(0);
      expect(result.next.name).toBe("Sprout");
      expect(result.progress).toBe(0);
    });

    it("should return Sprout with correct progress for points between Sprout and Sapling", () => {
      // Sprout threshold is 50, Sapling is 150. Span = 100.
      // For 100 points, progress = (100 - 50) / 100 = 0.5 (50%)
      const result = getLevel(100);
      expect(result.current.name).toBe("Sprout");
      expect(result.currentIndex).toBe(1);
      expect(result.next.name).toBe("Sapling");
      expect(result.progress).toBe(0.5);
    });

    it("should max out at Canopy Guardian and return progress 1 with null next level", () => {
      const result = getLevel(1500); // threshold is 1000
      expect(result.current.name).toBe("Canopy Guardian");
      expect(result.currentIndex).toBe(4);
      expect(result.next).toBeNull();
      expect(result.progress).toBe(1);
    });
  });

  describe("checkNewBadges", () => {
    it("should unlock First Step badge on first log", () => {
      const state = {
        entries: [{ category: "transport", type: "bus", value: 10, savedG: 2000, points: 40 }],
        points: 40,
        streak: 1,
        unlockedBadgeIds: [],
      };
      const unlocked = checkNewBadges(state);
      expect(unlocked.length).toBe(1);
      expect(unlocked[0].id).toBe("first_log");
    });

    it("should not double-unlock badges that are already unlocked", () => {
      const state = {
        entries: [{ category: "transport", type: "bus", value: 10, savedG: 2000, points: 40 }],
        points: 40,
        streak: 1,
        unlockedBadgeIds: ["first_log"],
      };
      const unlocked = checkNewBadges(state);
      expect(unlocked.length).toBe(0);
    });

    it("should unlock streak badges when streak threshold is met", () => {
      const state = {
        entries: [
          { category: "transport", type: "bus", value: 10, savedG: 2000, points: 40 },
          { category: "transport", type: "bus", value: 10, savedG: 2000, points: 40 },
          { category: "transport", type: "bus", value: 10, savedG: 2000, points: 40 },
        ],
        points: 120,
        streak: 3,
        unlockedBadgeIds: ["first_log"],
      };
      const unlocked = checkNewBadges(state);
      // streak_3 should unlock (On a Roll)
      // green_plate or pedal_power won't unlock since they haven't been met.
      expect(unlocked.map(b => b.id)).toContain("streak_3");
    });

    it("should unlock category specific badges like pedal_power and green_plate", () => {
      const state = {
        entries: [
          { category: "transport", type: "bicycle", value: 15, savedG: 3750, points: 75 },
          { category: "food", type: "vegan", value: 1, savedG: 2100, points: 42 },
        ],
        points: 117,
        streak: 1,
        unlockedBadgeIds: ["first_log"],
      };
      const unlocked = checkNewBadges(state);
      const ids = unlocked.map(b => b.id);
      expect(ids).toContain("pedal_power");
      expect(ids).toContain("green_plate");
      expect(ids).toContain("points_50"); // 117 points >= 50
    });
  });
});
