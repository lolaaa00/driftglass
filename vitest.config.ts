import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/frontend/setup.ts"],
    include: ["tests/frontend/**/*.test.ts", "tests/frontend/**/*.test.tsx"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
