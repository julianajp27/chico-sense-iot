import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

beforeEach(() => {
  sessionStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
  window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
});
