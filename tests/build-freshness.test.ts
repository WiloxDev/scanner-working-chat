import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const DIST = join(ROOT, "dist");
const SRC = join(ROOT, "src");

function newestMtime(dir: string): number {
	let newest = 0;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		newest = Math.max(newest, entry.isDirectory() ? newestMtime(path) : statSync(path).mtimeMs);
	}
	return newest;
}

test("build: dist/ is never older than src/ when a build directory exists", { skip: !existsSync(DIST) }, () => {
	const sources = newestMtime(SRC);
	const built = newestMtime(DIST);
	assert.ok(
		built >= sources,
		"dist/ is stale: the extension Pi loads is older than src/. Run `npm run build` before testing live.",
	);
});
