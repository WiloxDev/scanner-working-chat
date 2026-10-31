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

test("comet: reference cycle traverses both directions, preserves dots and pauses", () => {
	for (const width of [1, 3, 10, 22]) {
		const glyphs = ["H", "t", "s"];
		const passLength = width + glyphs.length;
		const cycleLength = 2 * passLength + width;
		for (let tick = 0; tick < cycleLength; tick++) {
			const frame = renderWorkingComet({ tick, width, color: false, config: { glyphs } });
			const head = tick < passLength ? tick : width - 1 - (tick - passLength);
			assert.equal(frame.indexOf("H"), head >= 0 && head < width ? head : -1);
			assert.equal(frame.length, width);
			assert.ok(!frame.includes(" "), "dim track must persist outside the comet");
			assert.equal(frame, renderWorkingComet({ tick: tick + cycleLength, width, color: false, config: { glyphs } }));
			if (tick >= 2 * passLength) assert.equal(frame, ".".repeat(width));
		}
		assert.equal(renderWorkingComet({ tick: 1, width: 3, color: false, config: { glyphs } }), "tH.");
		assert.equal(renderWorkingComet({ tick: 7, width: 3, color: false, config: { glyphs } }), ".Ht");
	}
});

test("comet: explicit left-to-right direction remains supported", () => {
	for (let tick = 0; tick < 10; tick++) {
		const frame = renderWorkingComet({ tick, width: 10, color: false, config: { direction: "ltr", glyphs: ["H", "t"] } });
		assert.equal(frame.indexOf("H"), tick);
	}
});

test("comet: negative ticks wrap and explicit right-to-left remains supported", () => {
	const config = { direction: "rtl" as const, glyphs: ["H", "t"] };
	for (let tick = 0; tick < 10; tick++) {
		assert.equal(renderWorkingComet({ tick, width: 10, color: false, config }).indexOf("H"), 9 - tick);
	}
	assert.equal(
		renderWorkingComet({ tick: -1, width: 10, color: false }),
		renderWorkingComet({ tick: 39, width: 10, color: false }),
	);
});

test("comet: head, tail and persistent track use descending configured brightness", () => {
	const original = process.env.NO_COLOR;
	try {
		delete process.env.NO_COLOR;
		const frame = renderWorkingComet({ tick: 2, width: 10 });
		for (const [r, g, b] of DEFAULT_COMET_CONFIG.colors.slice(0, 3)) {
			assert.ok(frame.includes(`\x1b[38;2;${r};${g};${b}m▪`));
		}
		assert.ok(frame.includes("\x1b[38;2;32;75;95m."));
	} finally {
		if (original === undefined) delete process.env.NO_COLOR;
		else process.env.NO_COLOR = original;
	}
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