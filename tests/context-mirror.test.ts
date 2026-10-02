import test from "node:test";
import assert from "node:assert/strict";
import { stripTerminalSequences } from "@earendil-works/pi-tui";
import {
	formatIdleContextBadge,
	evaluateContextAlertState,
	renderPromptContextMirror,
	SPECTRUM_CELL_COLORS,
} from "../src/shell-prompt-context-mirror.ts";

test("context-mirror: formatIdleContextBadge renders direct clean text", () => {
	const raw15 = stripTerminalSequences(formatIdleContextBadge(15));
	assert.equal(raw15, "15%");

	const raw86 = stripTerminalSequences(formatIdleContextBadge(86));
	assert.equal(raw86, "86%");

	const rawNull = formatIdleContextBadge(null);
	assert.equal(rawNull, "");
});

test("context-mirror: evaluateContextAlertState latching hazard alarm behavior", () => {
	// Normal range: no alarm
	assert.equal(evaluateContextAlertState(50, false, 90, 15), false);
	assert.equal(evaluateContextAlertState(89, false, 90, 15), false);

	// Crosses critical threshold (>= 90%) -> alarm activates
	assert.equal(evaluateContextAlertState(90, false, 90, 15), true);
	assert.equal(evaluateContextAlertState(95, false, 90, 15), true);

	// Latching: While alarm is active, remains active even when usage drops below 90%
	assert.equal(evaluateContextAlertState(80, true, 90, 15), true);
	assert.equal(evaluateContextAlertState(50, true, 90, 15), true);
	assert.equal(evaluateContextAlertState(20, true, 90, 15), true);

	// Drops to or below resetThreshold (<= 15%) -> alarm finally resets
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
