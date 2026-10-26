import { describe, it } from "node:test";
import assert from "node:assert";
import {
	detectTerminalProfile,
	ASCII_FALLBACK_PROFILE,
	UNICODE_PROFILE,
	NERD_FONT_PROFILE,
} from "../src/terminal-detect.js";

describe("terminal-detect", () => {
	it("detects ASCII profile when no UTF-8 is present in basic console", () => {
		const env = {
			LANG: "C",
			LC_ALL: "C",
			TERM: "linux",
		};
		const profile = detectTerminalProfile(env);
		assert.strictEqual(profile.isUtf8, false);
		assert.strictEqual(profile.hasNerdFont, false);
		assert.strictEqual(profile.recommendedUserIcon, "@");
		assert.strictEqual(profile.recommendedFlowerIcon, "*");
		assert.deepStrictEqual(profile.recommendedCometGlyphs, [">", "+", "*", ".", " "]);
	});

	it("detects Unicode profile when UTF-8 is present but no Nerd Font detected", () => {
		const env = {
			LANG: "en_US.UTF-8",
			TERM: "xterm-256color",
		};
		const profile = detectTerminalProfile(env);
		assert.strictEqual(profile.isUtf8, true);
		assert.strictEqual(profile.hasNerdFont, false);
		assert.strictEqual(profile.recommendedUserIcon, "●");
		assert.strictEqual(profile.recommendedFlowerIcon, "✿");
	});

	it("detects Nerd Font profile in Windows Terminal (WT_SESSION)", () => {
		const env = {
			LANG: "en_US.UTF-8",
			WT_SESSION: "374f8c12-32b4-4b55-8854-47f63116bc37",
		};
		const profile = detectTerminalProfile(env);
		assert.strictEqual(profile.isUtf8, true);
		assert.strictEqual(profile.hasNerdFont, true);
		assert.strictEqual(profile.recommendedUserIcon, "󰣇");
	});

	it("detects Nerd Font profile in Ghostty and Wezterm", () => {
		const envGhostty = {
			LANG: "en_US.UTF-8",
			TERM_PROGRAM: "ghostty",
		};
		assert.strictEqual(detectTerminalProfile(envGhostty).hasNerdFont, true);

		const envWez = {
			LANG: "en_US.UTF-8",
			TERM_PROGRAM: "WezTerm",
		};
		assert.strictEqual(detectTerminalProfile(envWez).hasNerdFont, true);
	});
});
