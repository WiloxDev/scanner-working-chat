import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig, hexToRgb, DEFAULT_CONFIG } from "../src/config.ts";

test("config: hexToRgb parses hex colors accurately", () => {
	assert.deepEqual(hexToRgb("#5CB8C7", [0, 0, 0]), [92, 184, 199]);
	assert.deepEqual(hexToRgb("7BC88F", [0, 0, 0]), [123, 200, 143]);
	assert.deepEqual(hexToRgb("#fff", [0, 0, 0]), [255, 255, 255]);
	assert.deepEqual(hexToRgb("invalid", [10, 20, 30]), [10, 20, 30]);
});

test("config: returns safe defaults when config file is absent", () => {
	const config = loadConfig({ configPath: "/tmp/non-existent-scanner-config-xyz.json" });
	assert.equal(config.enabled, true);
	assert.ok(typeof config.username === "string" && config.username.length > 0);
	assert.equal(config.flowerIcon, "✿");
	assert.equal(config.enableComet, true);
	assert.equal(config.criticalThreshold, 90);
	assert.equal(config.resetThreshold, 15);
	assert.deepEqual(config.colors.borderColor, [92, 184, 199]);
});

test("config: applies explicit overrides cleanly", () => {
	const config = loadConfig({
		configPath: "/tmp/non-existent-scanner-config-xyz.json",
		overrides: {
			username: "Carlos",
			flowerIcon: "✦",
			enableComet: false,
			criticalThreshold: 85,
			theme: {
				borderColor: "#FF0000",
			},
		},
	});

	assert.equal(config.username, "Carlos");
	assert.equal(config.flowerIcon, "✦");
	assert.equal(config.enableComet, false);
	assert.equal(config.criticalThreshold, 85);
	assert.deepEqual(config.colors.borderColor, [255, 0, 0]);
	// Unspecified colors remain default
	assert.deepEqual(config.colors.userNameColor, DEFAULT_CONFIG.colors.userNameColor);
});
