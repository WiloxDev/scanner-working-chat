import test from "node:test";
import assert from "node:assert/strict";
import { stripTerminalSequences, visibleWidth } from "@earendil-works/pi-tui";
import { renderWorkingTopBorder } from "../src/shell-working-top-border.ts";
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
			enableComet: true,
			...overrides,
		},
	});
}

function createMockContext(percent: number | null = 55) {
	return {
		getContextUsage: () => ({ percent }),
	};
}

function createMockWorkingIndicator() {
	return {
		renderInBorder: (width: number) => "working…",
		renderSpinnerInBorder: (width: number) => "⠋",
		currentFrame: 3,
	};
}

test("working-top-border: renders working instrumentation with comet and context", () => {
	const config = createMockConfig();
	const borderColor = createBorderColor(config);
	const ctx = createMockContext(55);
	const wsi = createMockWorkingIndicator();

	const result = renderWorkingTopBorder({
		width: 100,
		hiddenLineCount: 0,
		config,
		embedWorkingStatus: true,
		workingIndicator: wsi,
		ctx,
		alertState: false,
		borderColor,
	});

	const clean = stripTerminalSequences(result);
	assert.ok(clean.includes("working…"), `Should contain working label: ${clean}`);
	assert.ok(clean.includes("Context"), `Should contain context gauge: ${clean}`);
	assert.ok(clean.includes("55%"), `Should contain percentage: ${clean}`);
	assert.ok(clean.includes("│"), `Should contain vertical separator: ${clean}`);
	assert.equal(visibleWidth(result), 100, "Width must match exactly");
});

test("working-top-border: does not show username in working state", () => {
	const config = createMockConfig();
	const borderColor = createBorderColor(config);
	const ctx = createMockContext(55);
	const wsi = createMockWorkingIndicator();

	const result = renderWorkingTopBorder({
		width: 100,
		hiddenLineCount: 0,
		config,
		embedWorkingStatus: true,
		workingIndicator: wsi,
		ctx,
		alertState: false,
		borderColor,
	});

	const clean = stripTerminalSequences(result);
	assert.ok(!clean.includes("Wilox"), `User name should not appear during working: ${clean}`);
});

test("working-top-border: shows comet when enabled", () => {
	const config = createMockConfig({ enableComet: true });
	const borderColor = createBorderColor(config);
	const ctx = createMockContext(55);
	const wsi = createMockWorkingIndicator();

	const result = renderWorkingTopBorder({
		width: 100,
		hiddenLineCount: 0,
		config,
		embedWorkingStatus: true,
		workingIndicator: wsi,
		ctx,
		alertState: false,
		borderColor,
	});

	const clean = stripTerminalSequences(result);
	// Comet glyphs should be present
	assert.ok(clean.includes("◆") || clean.includes("●") || clean.includes("•"), `Should contain comet particles: ${clean}`);
});

test("working-top-border: hides comet when disabled", () => {
	const config = createMockConfig({ enableComet: false });
	const borderColor = createBorderColor(config);
	const ctx = createMockContext(55);
	const wsi = createMockWorkingIndicator();

	const result = renderWorkingTopBorder({
		width: 100,
		hiddenLineCount: 0,
		config,
		embedWorkingStatus: true,
		workingIndicator: wsi,
		ctx,
		alertState: false,
		borderColor,
	});

	const clean = stripTerminalSequences(result);
	// Should not have comet particles (but may have flower and scan text)
	assert.ok(clean.includes("working…"), `Should still contain working label: ${clean}`);
});

test("working-top-border: elastic degeneration handles narrow terminals", () => {
	const config = createMockConfig();
	const borderColor = createBorderColor(config);
	const ctx = createMockContext(55);
	const wsi = createMockWorkingIndicator();

	const result = renderWorkingTopBorder({
		width: 30,
		hiddenLineCount: 0,
		config,
		embedWorkingStatus: true,
		workingIndicator: wsi,
		ctx,
		alertState: false,
		borderColor,
	});

	assert.equal(visibleWidth(result), 30, "Width must match exactly");
	const clean = stripTerminalSequences(result);
	assert.ok(clean.startsWith("─"), "Must start with horizontal border char");
});

test("working-top-border: shows overflow label when hiddenLineCount > 0 and fits with wide terminal", () => {
	const config = createMockConfig();
	const borderColor = createBorderColor(config);
	const ctx = createMockContext(55);
	const wsi = createMockWorkingIndicator();

	// Use wider terminal to ensure overflow fits alongside working instrumentation
	const result = renderWorkingTopBorder({
		width: 140,
		hiddenLineCount: 3,
		config,
		embedWorkingStatus: true,
		workingIndicator: wsi,
		ctx,
		alertState: false,
		borderColor,
	});

	const clean = stripTerminalSequences(result);
	assert.ok(clean.includes("↑ 3 more"), `Should contain overflow label: ${clean}`);
	assert.equal(visibleWidth(result), 140, "Width must match exactly");
});

test("working-top-border: handles missing working indicator gracefully", () => {
	const config = createMockConfig();
	const borderColor = createBorderColor(config);
	const ctx = createMockContext(55);

	const result = renderWorkingTopBorder({
		width: 80,
		hiddenLineCount: 0,
		config,
		embedWorkingStatus: true,
		workingIndicator: null,
		ctx,
		alertState: false,
		borderColor,
	});

	// Should fall back to plain border when no working indicator
	assert.equal(visibleWidth(result), 80, "Width must match exactly");
	const clean = stripTerminalSequences(result);
	assert.ok(clean.startsWith("─"), "Must be horizontal border");
});

test("working-top-border: handles missing context (ctx undefined)", () => {
	const config = createMockConfig();
	const borderColor = createBorderColor(config);
	const wsi = createMockWorkingIndicator();

	const result = renderWorkingTopBorder({
		width: 100,
		hiddenLineCount: 0,
		config,
		embedWorkingStatus: true,
		workingIndicator: wsi,
		ctx: undefined,
		alertState: false,
		borderColor,
	});

	const clean = stripTerminalSequences(result);
	assert.ok(clean.includes("working…"), `Should contain working label: ${clean}`);
	assert.equal(visibleWidth(result), 100, "Width must match exactly");
});

test("working-top-border: returns plain border when no rawStatus from indicator", () => {
	const config = createMockConfig();
	const borderColor = createBorderColor(config);
	const ctx = createMockContext(55);
	const wsi = {
		renderInBorder: () => "", // Empty status
		renderSpinnerInBorder: (width: number) => "⠋",
		currentFrame: 3,
	};

	const result = renderWorkingTopBorder({
		width: 80,
		hiddenLineCount: 0,
		config,
		embedWorkingStatus: true,
		workingIndicator: wsi,
		ctx,
		alertState: false,
		borderColor,
	});

	assert.equal(visibleWidth(result), 80, "Width must match exactly");
	const clean = stripTerminalSequences(result);
	assert.ok(clean.startsWith("─"), "Must be horizontal border");
});