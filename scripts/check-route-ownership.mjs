#!/usr/bin/env node

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const appDir = join(process.cwd(), "src", "app");

if (!existsSync(appDir)) {
  console.error("Route ownership check failed: src/app directory not found.");
  process.exit(1);
}

const entries = readdirSync(appDir, { withFileTypes: true });

const hasRootPage = entries.some((entry) => entry.isFile() && entry.name === "page.tsx");
if (!hasRootPage) {
  console.error("Route ownership check failed: src/app/page.tsx is required.");
  process.exit(1);
}

const rogueRootPages = entries
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter(
    (name) =>
      /^page\b.*\.(tsx|ts|jsx|js)$/.test(name) &&
      name !== "page.tsx",
  );

if (rogueRootPages.length > 0) {
  console.error(
    "Route ownership check failed: unexpected root page artifacts found:",
  );
  for (const file of rogueRootPages) {
    console.error(` - src/app/${file}`);
  }
  process.exit(1);
}

console.log("Route ownership check passed.");
