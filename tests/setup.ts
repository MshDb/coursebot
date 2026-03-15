import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Optional: cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock environment variables if needed
vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/testdb");
vi.stubEnv("NEXTAUTH_SECRET", "test-secret-12345");
