import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import app from "../server/index.js";

describe("Express Server API Endpoints", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("GET /health", () => {
    it("should return a status of ok", async () => {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: "ok" });
    });
  });

  describe("POST /api/eco-tip", () => {
    it("should return 400 if request body has no summary", async () => {
      const response = await request(app)
        .post("/api/eco-tip")
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid request body");
    });

    it("should return a fallback tip if GROQ_API_KEY is not defined", async () => {
      delete process.env.GROQ_API_KEY;

      const response = await request(app)
        .post("/api/eco-tip")
        .send({
          summary: {
            category: "transport",
            type: "car",
            value: 20,
            impactG: 5000,
            savedG: 0,
            points: 0
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.source).toBe("fallback");
      expect(typeof response.body.tip).toBe("string");
    });

    it("should fetch a tip from Groq if GROQ_API_KEY is set and request succeeds", async () => {
      process.env.GROQ_API_KEY = "mock_groq_key";

      const mockResponseData = {
        choices: [
          {
            message: {
              content: "Mocked Groq tip: Swap one short ride for walking today!"
            }
          }
        ]
      };

      // Stub the global fetch API using Vitest stubGlobal
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponseData),
        })
      );
      vi.stubGlobal("fetch", mockFetch);

      const response = await request(app)
        .post("/api/eco-tip")
        .send({
          summary: {
            category: "transport",
            type: "car",
            value: 20,
            impactG: 5000,
            savedG: 0,
            points: 0
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.source).toBe("ai");
      expect(response.body.tip).toBe("Mocked Groq tip: Swap one short ride for walking today!");
      
      // Ensure the mock was called correctly
      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe("https://api.groq.com/openai/v1/chat/completions");
      expect(callArgs[1].method).toBe("POST");
      expect(JSON.parse(callArgs[1].body).model).toBe("llama-3.1-8b-instant");
    });

    it("should return a fallback tip if Groq API request throws an error", async () => {
      process.env.GROQ_API_KEY = "mock_groq_key";

      // Stub fetch to throw an error
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.reject(new Error("Network error connection failed"))
      );
      vi.stubGlobal("fetch", mockFetch);

      // Suppress console.error in tests to avoid noisy test output
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = await request(app)
        .post("/api/eco-tip")
        .send({
          summary: {
            category: "transport",
            type: "car",
            value: 20,
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.source).toBe("fallback");
      expect(typeof response.body.tip).toBe("string");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
