import test from "node:test";
import assert from "node:assert/strict";
import { stripTerminalSequences } from "@earendil-works/pi-tui";
import {
	formatIdleContextBadge,
	evaluateContextAlertState,
	renderPromptContextMirror,
	DEFAULT_SPECTRUM_CONFIG,
	type SpectrumConfig,
} from "../src/shell-prompt-context-mirror.ts";

test("context-mirror: formatIdleContextBadge renders direct clean text", () => {
	const raw15 = stripTerminalSequences(formatIdleContextBadge(15));
	assert.equal(raw15, "15%");

	const raw86 = stripTerminalSequences(formatIdleContextBadge(86));
	assert.equal(raw86, "86%");

	const rawNull = formatIdleContextBadge(null);
	assert.equal(rawNull, "");
});

test("context-mirror: formatIdleContextBadge respects custom config", () => {
	const customConfig: Partial<SpectrumConfig> = {
		cellColors: [
			[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0],
			[255, 0, 255], [0, 255, 255], [128, 128, 128], [255, 255, 255],
		] as const,
		neonRedPulsePeak: [255, 0, 0],
	};
	const raw50 = stripTerminalSequences(formatIdleContextBadge(50, 90, customConfig));
	assert.equal(raw50, "50%");
});

test("context-mirror: evaluateContextAlertState latching hazard alarm behavior", () => {
	assert.equal(evaluateContextAlertState(50, false, 90, 15), false);
	assert.equal(evaluateContextAlertState(89, false, 90, 15), false);
	assert.equal(evaluateContextAlertState(90, false, 90, 15), true);
	assert.equal(evaluateContextAlertState(95, false, 90, 15), true);
	assert.equal(evaluateContextAlertState(80, true, 90, 15), true);
	assert.equal(evaluateContextAlertState(50, true, 90, 15), true);
	assert.equal(evaluateContextAlertState(20, true, 90, 15), true);
	assert.equal(evaluateContextAlertState(15, true, 90, 15), false);
	assert.equal(evaluateContextAlertState(10, true, 90, 15), false);
});

test("context-mirror: renderPromptContextMirror produces gauge cells and percentage", () => {
	const renderedFull = stripTerminalSequences(
		renderPromptContextMirror({ percent: 50, color: false, tier: "full" }),
	);
	assert.ok(renderedFull.includes("Context"));
	assert.ok(renderedFull.includes("▰"));
	assert.ok(renderedFull.includes("▱"));
	assert.ok(renderedFull.includes("50%"));

	const renderedShort = stripTerminalSequences(
		renderPromptContextMirror({ percent: 75, color: false, tier: "short" }),
	);
	assert.ok(renderedShort.includes("Ctx"));
	assert.ok(renderedShort.includes("75%"));

	const renderedPctOnly = stripTerminalSequences(
		renderPromptContextMirror({ percent: 92, color: false, tier: "percentOnly" }),
	);
	assert.equal(renderedPctOnly.trim(), "92%");
});

test("context-mirror: renderPromptContextMirror respects custom spectrum config", () => {
	const customConfig: Partial<SpectrumConfig> = {
		cellColors: [
			[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0],
			[255, 0, 255], [0, 255, 255], [128, 128, 128], [255, 255, 255],
		] as const,
		emptyCellColor: [50, 50, 50],
		labelColor: [255, 255, 0],
		warningThreshold: 70,
		criticalThreshold: 90,
		resetThreshold: 15,
		neonRedPulseBase: [100, 0, 0],
		neonRedPulsePeak: [255, 0, 0],
	};

	const rendered = stripTerminalSequences(
		renderPromptContextMirror({ percent: 50, color: false, tier: "full", config: customConfig }),
	);
	assert.ok(rendered.includes("Context"));
	assert.ok(rendered.includes("50%"));
});

test("context-mirror: warning threshold triggers amber blend in gauge (70-89%)", () => {
	// At 75% (in warning zone 70-89%), cells 5-6 (indices 4-5) should blend towards amber
	const config: Partial<SpectrumConfig> = {
		...DEFAULT_SPECTRUM_CONFIG,
		warningThreshold: 70,
		criticalThreshold: 90,
	};
	const rendered = stripTerminalSequences(
		renderPromptContextMirror({ percent: 75, color: false, tier: "full", config }),
	);
	// Should contain gauge cells and percentage
	assert.ok(rendered.includes("75%"));
	assert.ok(rendered.includes("▰"));
	assert.ok(rendered.includes("▱"));
});

test("context-mirror: critical threshold triggers hazard alarm with neon red pulse", () => {
	const config: Partial<SpectrumConfig> = {
		...DEFAULT_SPECTRUM_CONFIG,
		criticalThreshold: 90,
		neonRedPulseBase: [120, 20, 35],
		neonRedPulsePeak: [255, 30, 68],
	};
	// At 95% with alert=true, should use neon red pulse
	const rendered = renderPromptContextMirror({ percent: 95, alert: true, tick: 0, color: true, config });
	// Should contain ANSI color codes for neon red
	assert.ok(rendered.includes("\x1b[38;2;"));
});