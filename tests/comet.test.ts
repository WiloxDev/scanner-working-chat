import test from "node:test";
import assert from "node:assert/strict";
import { stripTerminalSequences, visibleWidth } from "@earendil-works/pi-tui";
import {
	renderWorkingComet,
	isWorkingCometEnabled,
	COMET_GLYPHS,
} from "../src/shell-working-comet.ts";

test("comet: invariant of exact visible track width across multiple ticks", () => {
	const widths = [10, 15, 22];
	for (const width of widths) {
		for (let tick = 0; tick < 50; tick++) {
			const rendered = renderWorkingComet({ tick, width, color: true });
			assert.equal(
				visibleWidth(rendered),
				width,
				`Track width must strictly match ${width} on tick ${tick}`,
			);
		}
	}
});

test("comet: glyphs cycle properly and contain comet particles", () => {
	let foundHead = false;
	const trackWidth = 10;
	// Cycle through trackWidth + COMET_GLYPHS.length ticks
	for (let tick = 0; tick < trackWidth + COMET_GLYPHS.length; tick++) {
		const raw = stripTerminalSequences(renderWorkingComet({ tick, width: trackWidth, color: false }));
		if (raw.includes("◆")) {
			foundHead = true;
			break;
		}
	}
	assert.ok(foundHead, "Comet should render head glyph ◆ during its cycle");
});

test("comet: zero width returns empty string", () => {
	assert.equal(renderWorkingComet({ tick: 5, width: 0 }), "");
});

test("comet: isWorkingCometEnabled respects environment flags", () => {
	const original = process.env.GENTLE_PI_WORKING_COMET;
	try {
		delete process.env.GENTLE_PI_WORKING_COMET;
		assert.equal(isWorkingCometEnabled(), true);

		process.env.GENTLE_PI_WORKING_COMET = "0";
		assert.equal(isWorkingCometEnabled(), false);

		process.env.GENTLE_PI_WORKING_COMET = "false";
		assert.equal(isWorkingCometEnabled(), false);

		process.env.GENTLE_PI_WORKING_COMET = "1";
		assert.equal(isWorkingCometEnabled(), true);
	} finally {
		if (original !== undefined) {
			process.env.GENTLE_PI_WORKING_COMET = original;
		} else {
			delete process.env.GENTLE_PI_WORKING_COMET;
		}
	}
});
