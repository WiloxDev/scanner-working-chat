import test from "node:test";
import assert from "node:assert/strict";
import { stripTerminalSequences, visibleWidth } from "@earendil-works/pi-tui";
import { ScannerWorkingEditor, cleanStatusLabel } from "../src/ScannerWorkingEditor.ts";
import { loadConfig } from "../src/config.ts";

function createMockTui(): any {
	return {
		requestRender: () => {},
		terminal: {
			rows: 24,
			columns: 80,
		},
	};
}

function createMockTheme(): any {
	return {
		fg: (_role: string, text: string) => text,
		bold: (text: string) => text,
	};
}

function createMockKeybindings(): any {
	return {
		matches: () => false,
	};
}

function createMockContext(usagePercent: number | null = 25): any {
	return {
		getContextUsage: () => ({
			tokens: 25000,
			contextWindow: 100000,
			percent: usagePercent,
		}),
		ui: {
			theme: {
				fg: (_role: string, text: string) => text,
				bold: (text: string) => text,
			},
		},
	};
}

test("editor: cleanStatusLabel cleans control and status labels", () => {
	assert.equal(cleanStatusLabel("working"), "working…");
	assert.equal(cleanStatusLabel("working…"), "working…");
	assert.equal(cleanStatusLabel("Thinking"), "Thinking…");
	assert.equal(cleanStatusLabel(""), "working…");
});

test("editor: renders top border in IDLE with identity and context", () => {
	const config = loadConfig({
		configPath: "/tmp/non-existent.json",
		overrides: {
			username: "Wilox",
			userIcon: "󰣇",
			flowerIcon: "✿",
		},
	});

	const tui = createMockTui();
	const theme = createMockTheme();
	const keybindings = createMockKeybindings();
	const ctx = createMockContext(18);

	const editor = new ScannerWorkingEditor(tui, theme, keybindings, ctx, config);

	// Test render(80)[0] which includes the outer corners
	const lines = editor.render(80);
	const top = lines[0];
	const clean = stripTerminalSequences(top);

	assert.ok(clean.startsWith("╭"), `Top border line should start with '╭': ${clean}`);
	assert.ok(clean.endsWith("╮"), `Top border line should end with '╮': ${clean}`);
	assert.ok(clean.includes("󰣇 Wilox ✿"), `Top border should contain user badge: ${clean}`);
	assert.ok(clean.includes("Ctx: 18%"), `Top border should contain context badge: ${clean}`);
});

test("editor: renders top border in WORKING state", () => {
	const config = loadConfig({
		configPath: "/tmp/non-existent.json",
		overrides: {
			username: "Wilox",
			userIcon: "󰣇",
			flowerIcon: "✿",
			enableComet: true,
		},
	});

	const tui = createMockTui();
	const theme = createMockTheme();
	const keybindings = createMockKeybindings();
	const ctx = createMockContext(55);

	const editor = new ScannerWorkingEditor(tui, theme, keybindings, ctx, config);

	// Simulate active workingStatusIndicator via public API
	editor.setWorkingStatusIndicator({
		renderInBorder: () => "working…",
		renderSpinnerInBorder: () => "",
		setIndicator: () => {},
	});

	const top = (editor as any).renderTopBorder(100, 0);
	const clean = stripTerminalSequences(top);

	// In working state, user name disappears and working instrumentation appears
	assert.ok(!clean.includes("Wilox"), `User name should not appear during working: ${clean}`);
	assert.ok(clean.includes("working…"), `Should contain working label: ${clean}`);
	assert.ok(clean.includes("Context"), `Should contain context gauge: ${clean}`);
	assert.ok(clean.includes("55%"), `Should contain percentage: ${clean}`);
	assert.ok(clean.includes("│"), `Should contain vertical separator: ${clean}`);
});

test("editor: elastic degeneration handles narrow terminals without breaking", () => {
	const config = loadConfig({
		configPath: "/tmp/non-existent.json",
		overrides: {
			username: "Wilox",
			userIcon: "󰣇",
			flowerIcon: "✿",
		},
	});

	const tui = createMockTui();
	const theme = createMockTheme();
	const keybindings = createMockKeybindings();
	const ctx = createMockContext(40);

	const editor = new ScannerWorkingEditor(tui, theme, keybindings, ctx, config);

	const narrowWidth = 25;
	const lines = editor.render(narrowWidth);
	const top = lines[0];
	const clean = stripTerminalSequences(top);

	assert.equal(visibleWidth(clean), narrowWidth, `Width must strictly match ${narrowWidth}`);
	assert.ok(clean.startsWith("╭"), "Must start with ╭");
	assert.ok(clean.endsWith("╮"), "Must end with ╮");
});

test("editor: elapsed-time animation and smooth transition", () => {
	const config = loadConfig({
		configPath: "/tmp/non-existent.json",
		overrides: {
			username: "Wilox",
			userIcon: "󰣇",
			flowerIcon: "✿",
			enableComet: true,
			cometSpeedMs: 50,
		},
	});

	const tui = createMockTui();
	const theme = createMockTheme();
	const keybindings = createMockKeybindings();
	const ctx = createMockContext(20);

	const editor = new ScannerWorkingEditor(tui, theme, keybindings, ctx, config);

	editor.setWorkingStatusIndicator({
		renderInBorder: () => "working…",
		renderSpinnerInBorder: () => "",
		setIndicator: () => {},
	});

	// Frame 1: working
	const workingTop = (editor as any).renderTopBorder(100, 0);
	assert.ok(stripTerminalSequences(workingTop).includes("working…"));

	// Switch indicator to null (idle event)
	editor.setWorkingStatusIndicator(null);

	// Within 200ms transition window, it renders smooth transition state
	const transitionTop = (editor as any).renderTopBorder(100, 0);
	assert.ok(transitionTop.length > 0);
});

