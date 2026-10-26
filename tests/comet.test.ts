import test from "node:test";
import assert from "node:assert/strict";
import { stripTerminalSequences, visibleWidth } from "@earendil-works/pi-tui";
import {
	renderWorkingComet,
	isWorkingCometEnabled,
	DEFAULT_COMET_CONFIG,
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
	const glyphs = DEFAULT_COMET_CONFIG.glyphs;
	const headGlyph = glyphs[0];
	// Cycle through trackWidth + glyphs.length ticks
	for (let tick = 0; tick < trackWidth + glyphs.length; tick++) {
		const raw = stripTerminalSequences(renderWorkingComet({ tick, width: trackWidth, color: false }));
		if (raw.includes(headGlyph)) {
			foundHead = true;
			break;
		}
	}
	assert.ok(foundHead, `Comet should render head glyph ${headGlyph} during its cycle`);
});

test("comet: custom glyphs and colors are respected", () => {
	const customGlyphs = ["★", "☆", "✦"];
	const customColors = [
		[255, 0, 0],
		[0, 255, 0],
		[0, 0, 255],
	] as const;
	const rendered = renderWorkingComet({
		tick: 0,
		width: 10,
		color: false,
		config: { glyphs: customGlyphs, colors: customColors },
	});
	const raw = stripTerminalSequences(rendered);
	assert.ok(raw.includes("★"), "Custom head glyph should be rendered");
	assert.equal(visibleWidth(rendered), 10, "Track width must match with custom config");
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