import { describe, it, expect, vi } from "vitest";
import { parseLocalDate, todayString, nextStreak } from "../src/utils/habitHelpers";

describe("habitHelpers.js", () => {
  describe("parseLocalDate", () => {
    it("should parse date string local-safely without shifting to UTC", () => {
      const parsed = parseLocalDate("2026-06-19");
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(5); // 0-indexed (June is 5)
      expect(parsed.getDate()).toBe(19);
    });

    it("should return a Date object for empty/invalid inputs", () => {
      const parsedNull = parseLocalDate(null);
      expect(parsedNull).toBeInstanceOf(Date);

      const parsedEmpty = parseLocalDate("");
      expect(parsedEmpty).toBeInstanceOf(Date);
    });
  });

  describe("todayString", () => {
    it("should return a correct YYYY-MM-DD string from a Date object", () => {
      const mockDate = new Date("2026-06-19T10:30:00");
      expect(todayString(mockDate)).toBe("2026-06-19");
    });

    it("should default to the current date if no date is passed", () => {
      const result = todayString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("nextStreak", () => {
    it("should return 1 if there is no last activity date", () => {
      expect(nextStreak(null, 5, "2026-06-19")).toBe(1);
      expect(nextStreak(undefined, 3, "2026-06-19")).toBe(1);
    });

    it("should preserve the current streak if user already logged today", () => {
      expect(nextStreak("2026-06-19", 5, "2026-06-19")).toBe(5);
    });

    it("should increment the streak if the last activity was exactly yesterday", () => {
      expect(nextStreak("2026-06-18", 5, "2026-06-19")).toBe(6);
    });

    it("should reset the streak to 1 if there is a gap of 2 or more days", () => {
      expect(nextStreak("2026-06-17", 5, "2026-06-19")).toBe(1);
      expect(nextStreak("2026-06-10", 12, "2026-06-19")).toBe(1);
    });

    it("should handle DST spring forward transition (23-hour gap)", () => {
      // Simulate when difference in milliseconds between two local midnights is 23 hours
      // We can mock parseLocalDate to return dates that are 23 hours apart
      const lastDate = "2026-03-08";
      const today = "2026-03-09";
      
      const lastDateObj = new Date("2026-03-08T00:00:00");
      // Create a date object that is exactly 23 hours later
      const todayDateObj = new Date(lastDateObj.getTime() + 23 * 60 * 60 * 1000);

      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      
      // Let's create a custom nextStreak calculation checking rounding math
      const diffTime = todayDateObj.getTime() - lastDateObj.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      expect(diffDays).toBe(1);
      
      // Real nextStreak call check
      // For spring forward dates: March 8 to March 9
      const result = nextStreak("2026-03-08", 4, "2026-03-09");
      expect(result).toBe(5);
      
      spy.mockRestore();
    });

    it("should handle DST autumn fall back transition (25-hour gap)", () => {
      const lastDate = "2026-11-01";
      const today = "2026-11-02";

      const lastDateObj = new Date("2026-11-01T00:00:00");
      // Create a date object that is exactly 25 hours later
      const todayDateObj = new Date(lastDateObj.getTime() + 25 * 60 * 60 * 1000);
      
      const diffTime = todayDateObj.getTime() - lastDateObj.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      expect(diffDays).toBe(1);

      // Real nextStreak call check
      // For autumn fall back: Nov 1 to Nov 2
      const result = nextStreak("2026-11-01", 10, "2026-11-02");
      expect(result).toBe(11);
    });

    it("should handle invalid dates or future dates by resetting to 1", () => {
      expect(nextStreak("invalid-date", 3, "2026-06-19")).toBe(1);
      // Future date relative to today
      expect(nextStreak("2026-06-25", 5, "2026-06-19")).toBe(1);
    });
  });
});
