import test from "node:test";
import assert from "node:assert/strict";
import {
	loadConfig,
	hexToRgb,
	validateAndSanitizeConfig,
	resolveDefaultUsername,
	DEFAULT_CONFIG,
	DEFAULT_COMET_GLYPHS,
	DEFAULT_COMET_COLORS,
	DEFAULT_SPECTRUM_COLORS,
} from "../src/config.ts";

test("config: hexToRgb parses hex colors accurately", () => {
	assert.deepEqual(hexToRgb("#5CB8C7", [0, 0, 0]), [92, 184, 199]);
	assert.deepEqual(hexToRgb("7BC88F", [0, 0, 0]), [123, 200, 143]);
	assert.deepEqual(hexToRgb("#fff", [0, 0, 0]), [255, 255, 255]);
	assert.deepEqual(hexToRgb("invalid", [10, 20, 30]), [10, 20, 30]);
});

test("config: returns safe defaults when config file is absent", () => {
	const config = loadConfig({ configPath: "/tmp/non-existent-scanner-config-xyz.json" });
	assert.equal(config.enabled, true);
	assert.equal(config.zenMode, false);
	assert.equal(config.showWorkingDuration, true);
	assert.ok(typeof config.username === "string" && config.username.length > 0);
	assert.equal(config.flowerIcon, "✿");
	assert.equal(config.enableComet, true);
	assert.equal(config.criticalThreshold, 90);
	assert.equal(config.resetThreshold, 15);
	assert.deepEqual(config.colors.borderColor, [92, 184, 199]);
	assert.deepEqual(config.cometGlyphs, [...DEFAULT_COMET_GLYPHS]);
	assert.deepEqual(config.cometColors, [...DEFAULT_COMET_COLORS]);
	assert.deepEqual(config.spectrumColors, [...DEFAULT_SPECTRUM_COLORS]);
	assert.deepEqual(config.colors.labelColor, [92, 184, 199]);
	assert.deepEqual(config.colors.emptyCellColor, [70, 85, 100]);
	assert.deepEqual(config.colors.neonRedPulseBase, [120, 20, 35]);
	assert.deepEqual(config.colors.neonRedPulsePeak, [255, 30, 68]);
});

test("config: applies explicit overrides cleanly", () => {
	const config = loadConfig({
		configPath: "/tmp/non-existent-scanner-config-xyz.json",
		overrides: {
			username: "Carlos",
			flowerIcon: "✦",
			enableComet: false,
			zenMode: true,
			criticalThreshold: 85,
			theme: {
				borderColor: "#FF0000",
			},
		},
	});

	assert.equal(config.username, "Carlos");
	assert.equal(config.flowerIcon, "✦");
	assert.equal(config.enableComet, false);
	assert.equal(config.zenMode, true);
	assert.equal(config.criticalThreshold, 85);
	assert.deepEqual(config.colors.borderColor, [255, 0, 0]);
	assert.deepEqual(config.colors.userNameColor, DEFAULT_CONFIG.colors.userNameColor);
});

test("config: applies comet and spectrum overrides", () => {
	const customGlyphs = ["★", "☆"];
	const customCometColors = ["#FF0000", "#00FF00"];
	const customSpectrumColors = ["#111111", "#222222", "#333333", "#444444", "#555555", "#666666", "#777777", "#888888"];

	const config = loadConfig({
		configPath: "/tmp/non-existent-scanner-config-xyz.json",
		overrides: {
			cometGlyphs: customGlyphs,
			cometColors: customCometColors,
			spectrumColors: customSpectrumColors,
			theme: {
				labelColor: "#ABCDEF",
				emptyCellColor: "#FEDCBA",
				neonRedPulseBase: "#123456",
				neonRedPulsePeak: "#654321",
			},
		},
	});

	assert.deepEqual(config.cometGlyphs, customGlyphs);
	assert.deepEqual(config.cometColors, [[255, 0, 0], [0, 255, 0]]);
	assert.deepEqual(config.spectrumColors, [
		[17, 17, 17], [34, 34, 34], [51, 51, 51], [68, 68, 68],
		[85, 85, 85], [102, 102, 102], [119, 119, 119], [136, 136, 136],
	]);
	assert.deepEqual(config.colors.labelColor, [171, 205, 239]);
	assert.deepEqual(config.colors.emptyCellColor, [254, 220, 186]);
	assert.deepEqual(config.colors.neonRedPulseBase, [18, 52, 86]);
	assert.deepEqual(config.colors.neonRedPulsePeak, [101, 67, 33]);
});

test("config: validateAndSanitizeConfig detects invalid schemas safely", () => {
	const invalidRaw = {
		enabled: "not-a-boolean",
		warningThreshold: 95,
		criticalThreshold: 80, // warning >= critical error
		cometGlyphs: "not-an-array",
	};

	const { sanitized, errors } = validateAndSanitizeConfig(invalidRaw);
	assert.equal(errors.length >= 3, true);
	assert.ok(errors.some((e) => e.includes("enabled")));
	assert.ok(errors.some((e) => e.includes("warningThreshold")));
	assert.ok(errors.some((e) => e.includes("cometGlyphs")));
	assert.equal(sanitized.enabled, undefined);
});

test("config: resolveDefaultUsername handles fallback safely", () => {
	const user = resolveDefaultUsername();
	assert.ok(typeof user === "string" && user.length > 0, "Username must resolve to non-empty string");
});
