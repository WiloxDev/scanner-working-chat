import test from "node:test";
import assert from "node:assert/strict";
import { stripTerminalSequences, visibleWidth } from "@earendil-works/pi-tui";
import { renderIdleTopBorder } from "../src/shell-idle-badge.ts";
import { loadConfig, DEFAULT_CONFIG } from "../src/config.ts";

function createBorderColor(config: typeof DEFAULT_CONFIG) {
	const [br, bg, bb] = config.colors.borderColor;
	return (text: string) => `\x1b[38;2;${br};${bg};${bb}m${text}\x1b[0m`;
}

function createMockConfig(overrides: Partial<typeof DEFAULT_CONFIG> = {}) {
	return loadConfig({
		configPath: "/tmp/non-existent.json",
		overrides: {
			username: "Wilox",
			userIcon: "󰣇",
			flowerIcon: "✿",
			...overrides,
		},
	});
}

test("idle-badge: renders user badge with username and flower", () => {
	const config = createMockConfig();
	const borderColor = createBorderColor(config);

	const result = renderIdleTopBorder({
		width: 80,
		hiddenLineCount: 0,
		config,
		username: "Wilox",
		percent: 18,
		borderColor,
	});

	const clean = stripTerminalSequences(result);
	// Pure function returns top border LINE content (without corners ╭╮)
	// The borderColor function uses "─" for horizontal line
	assert.ok(clean.startsWith("─"), `Should start with horizontal border: ${clean}`);
	assert.ok(clean.includes("󰣇 Wilox ✿"), `Should contain user badge: ${clean}`);
	assert.ok(clean.includes("Ctx: 18%"), `Should contain context badge: ${clean}`);
	assert.equal(visibleWidth(result), 80, "Width must match exactly");
});

test("idle-badge: hides context badge when showContextInIdle is false", () => {
	const config = createMockConfig({ showContextInIdle: false });
	const borderColor = createBorderColor(config);

	const result = renderIdleTopBorder({
		width: 80,
		hiddenLineCount: 0,
		config,
		username: "Wilox",
		percent: 50,
		borderColor,
	});

	const clean = stripTerminalSequences(result);
	assert.ok(!clean.includes("Ctx:"), `Should not contain context badge: ${clean}`);
	assert.ok(clean.includes("󰣇 Wilox ✿"), `Should still contain user badge: ${clean}`);
	assert.equal(visibleWidth(result), 80, "Width must match exactly");
});

test("idle-badge: elastic degeneration drops ctxBadge when narrow", () => {
	const config = createMockConfig();
	const borderColor = createBorderColor(config);

	// Width 20 - definitely too narrow for full badge with ctx (badge ~25 chars)
	const result = renderIdleTopBorder({
		width: 20,
		hiddenLineCount: 0,
		config,
		username: "Wilox",
		percent: 50,
		borderColor,
	});

	const clean = stripTerminalSequences(result);
	assert.equal(visibleWidth(result), 20, "Width must match exactly");
	assert.ok(clean.startsWith("─"), "Must start with horizontal border");
	// In narrow mode, ctxBadge should be dropped
	assert.ok(!clean.includes("Ctx:"), `Should drop ctxBadge when narrow: ${clean}`);
});

test("idle-badge: shows overflow label when hiddenLineCount > 0 and fits", () => {
	const config = createMockConfig();
	const borderColor = createBorderColor(config);

	const result = renderIdleTopBorder({
		width: 80,
		hiddenLineCount: 5,
		config,
		username: "Wilox",
		percent: 18,
		borderColor,
	});

	const clean = stripTerminalSequences(result);
	assert.ok(clean.includes("↑ 5 more"), `Should contain overflow label: ${clean}`);
	assert.equal(visibleWidth(result), 80, "Width must match exactly");
});

test("idle-badge: handles very narrow terminal (minimum width)", () => {
	const config = createMockConfig();
	const borderColor = createBorderColor(config);

	const result = renderIdleTopBorder({
		width: 10,
		hiddenLineCount: 0,
		config,
		username: "Wilox",
		percent: 50,
		borderColor,
	});

	assert.equal(visibleWidth(result), 10, "Width must match exactly");
	const clean = stripTerminalSequences(result);
	assert.ok(clean.startsWith("─"), "Must start with horizontal border char");
});

test("idle-badge: renders compaction count badge when compactionCount > 0", () => {
	const config = createMockConfig({ showCompactionCount: true, compactionIcon: "📦" });
	const borderColor = createBorderColor(config);

	const result = renderIdleTopBorder({
		width: 100,
		hiddenLineCount: 0,
		config,
		username: "Wilox",
		percent: 35,
		compactionCount: 2,
		borderColor,
	});

	const clean = stripTerminalSequences(result);
	assert.ok(clean.includes("📦×2"), `Should display compaction count badge: ${clean}`);
	assert.equal(visibleWidth(result), 100, "Width must match exactly");
});

test("idle-badge: omits compaction badge when compactionCount is 0", () => {
	const config = createMockConfig({ showCompactionCount: true, compactionIcon: "📦" });
	const borderColor = createBorderColor(config);

	const result = renderIdleTopBorder({
		width: 100,
		hiddenLineCount: 0,
		config,
		username: "Wilox",
		percent: 35,
		compactionCount: 0,
		borderColor,
	});

	const clean = stripTerminalSequences(result);
	assert.ok(!clean.includes("📦"), `Should not contain compaction badge when count is 0: ${clean}`);
	assert.equal(visibleWidth(result), 100, "Width must match exactly");
});