// Extends Vitest's `expect` with jsdom-aware matchers like
// `toBeInTheDocument()` — imported once here so every test file gets them
// for free without repeating the import everywhere.
import "@testing-library/jest-dom/vitest";
