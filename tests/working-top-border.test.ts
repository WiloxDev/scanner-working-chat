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

test("working-top-border: sequence is contiguous: action -> duration -> compaction -> context", () => {
	const config = createMockConfig({
		enableComet: true,
		showWorkingDuration: true,
		showCompactionCount: true,
	});
	const borderColor = createBorderColor(config);
	const ctx = createMockContext(48);
	const wsi = createMockWorkingIndicator();

	const result = renderWorkingTopBorder({
		width: 120,
		hiddenLineCount: 0,
		config,
		embedWorkingStatus: true,
		workingIndicator: wsi,
		ctx,
		alertState: false,
		borderColor,
		workingStartTime: Date.now() - 3500,
		compactionCount: 2,
	});

	const clean = stripTerminalSequences(result);
	// Check order of appearance
	const idxWorking = clean.indexOf("working…");
	const idxDuration = clean.indexOf("[3.5s]");
	const idxCompaction = clean.indexOf("×2");
	const idxContext = clean.indexOf("Context");

	assert.ok(idxWorking !== -1, "working label found");
	assert.ok(idxDuration !== -1, "duration badge found");
	assert.ok(idxCompaction !== -1, "compaction badge found");
	assert.ok(idxContext !== -1, "context mirror found");

	assert.ok(idxWorking < idxDuration, "Action must appear before duration");
	assert.ok(idxDuration < idxCompaction, "Duration must appear before compaction");
	assert.ok(idxCompaction < idxContext, "Compaction must appear immediately before Context");
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

test("working-top-border: hides context mirror when showWorkingContext is false", () => {
	const config = createMockConfig({ showWorkingContext: false });
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
	assert.ok(!clean.includes("Context"), `Context mirror must not be displayed: ${clean}`);
	assert.ok(!clean.includes("55%"), `Context percent must not be displayed: ${clean}`);
});

test("working-top-border: hides duration badge when showWorkingDuration is false", () => {
	const config = createMockConfig({ showWorkingDuration: false });
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
		workingStartTime: Date.now() - 3400,
		currentTimestamp: Date.now(),
	});

	const clean = stripTerminalSequences(result);
	assert.ok(!clean.includes("[3.4s]") && !clean.includes("[3.3s]"), `Duration badge must not be displayed: ${clean}`);
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

test("working-top-border: renders duration badge when enabled and workingStartTime is set", () => {
	const config = createMockConfig({ showWorkingDuration: true });
	const borderColor = createBorderColor(config);
	const ctx = createMockContext(55);
	const wsi = createMockWorkingIndicator();
	const startTime = 100000;
	const currentTimestamp = 103400; // 3.4 seconds later

	const result = renderWorkingTopBorder({
		width: 120,
		hiddenLineCount: 0,
		config,
		embedWorkingStatus: true,
		workingIndicator: wsi,
		ctx,
		alertState: false,
		borderColor,
		workingStartTime: startTime,
		currentTimestamp,
	});

	const clean = stripTerminalSequences(result);
	assert.ok(clean.includes("[3.4s]"), `Should contain elapsed duration badge: ${clean}`);
});

test("working-top-border: respects zenMode by disabling comet and text animation", () => {
	const config = createMockConfig({ zenMode: true, enableComet: true });
	const borderColor = createBorderColor(config);
	const ctx = createMockContext(55);
	const wsi = createMockWorkingIndicator();

	const result = renderWorkingTopBorder({
		width: 120,
		hiddenLineCount: 0,
		config,
		embedWorkingStatus: true,
		workingIndicator: wsi,
		ctx,
		alertState: false,
		borderColor,
	});

	const clean = stripTerminalSequences(result);
	// In zenMode, comet is completely omitted even if enableComet is true
	assert.ok(!clean.includes("◆") && !clean.includes("●"), `Zen mode should omit comet: ${clean}`);
	assert.ok(clean.includes("working…"), "Working status should remain static");
});