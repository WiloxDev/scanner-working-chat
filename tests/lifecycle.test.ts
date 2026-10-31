import test from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, unlinkSync } from "node:fs";
import activate from "../src/index.ts";
import { COMMUNITY_REGISTRY_SLOT } from "../src/wilox-community.ts";

const PROMPT_OWNER = Symbol.for("gentle-pi.prompt-owner");
const TEST_CONFIG_PATH = "/tmp/test-scanner-lifecycle-config.json";

function setupTestConfigFile(enabled: boolean) {
	writeFileSync(
		TEST_CONFIG_PATH,
		JSON.stringify({
			scanner: {
				enabled,
				username: "Wilox",
			},
		}),
		"utf8",
	);
	process.env.SCANNER_CHAT_CONFIG = TEST_CONFIG_PATH;
}

function cleanupTestConfigFile() {
	delete process.env.SCANNER_CHAT_CONFIG;
	try {
		unlinkSync(TEST_CONFIG_PATH);
	} catch {}
}

function createMockPi() {
	const handlers: Record<string, Array<Function>> = {};
	const commands: Record<string, any> = {};

	return {
		on: (event: string, handler: Function) => {
			if (!handlers[event]) handlers[event] = [];
			handlers[event].push(handler);
		},
		registerCommand: (name: string, def: any) => {
			commands[name] = def;
		},
		emit: (event: string, ...args: any[]) => {
			const list = handlers[event] || [];
			for (const h of list) {
				// Pi events pass (event, ctx) to handlers: (pi.on("session_start", (_event, ctx) => ...))
				h(event, ...args);
			}
		},
		handlers,
		commands,
	};
}

function createMockUIContext(initialFactory?: any) {
	let currentFactory = initialFactory;
	let workingVisible = true;
	const notifications: Array<{ msg: string; type: string }> = [];

	return {
		ctx: {
			hasUI: true,
			sessionManager: {
				getSessionId: () => "mock-session-id",
			},
			ui: {
				getEditorComponent: () => currentFactory,
				setEditorComponent: (factory: any) => {
					currentFactory = factory;
				},
				setWorkingVisible: (visible: boolean) => {
					workingVisible = visible;
				},
				notify: (msg: string, type: string) => {
					notifications.push({ msg, type });
				},
				theme: {
					fg: (_role: string, text: string) => text,
					bold: (text: string) => text,
				},
			},
		},
		getFactory: () => currentFactory,
		getWorkingVisible: () => workingVisible,
		setWorkingVisibleDirect: (v: boolean) => {
			workingVisible = v;
		},
		notifications,
	};
}

test("lifecycle: preserves and restores host editor factory on disable", async () => {
	setupTestConfigFile(true);
	try {
		// 1. Simulate Gentle Shell setting up its custom prompt editor first
		const gentlePromptFactory: any = () => ({
			isGentlePrompt: true,
			dispose: () => {},
		});
		gentlePromptFactory[PROMPT_OWNER] = true;

		const mockEnv = createMockUIContext(gentlePromptFactory);
		mockEnv.setWorkingVisibleDirect(false); // Gentle Shell hides native working row

		const pi = createMockPi();

		// Global registry bus
		const bus = new Map<string, any>();
		(globalThis as any)[COMMUNITY_REGISTRY_SLOT] = bus;

		activate(pi as any);

		// Trigger session_start
		pi.emit("session_start", mockEnv.ctx);

		// Scanner editor should now be mounted
		const scannerFactory = mockEnv.getFactory();
		assert.notEqual(scannerFactory, gentlePromptFactory, "Scanner editor should have replaced host editor");
		assert.equal(mockEnv.getWorkingVisible(), false, "Working visibility should be false under scanner editor");

		// Now simulate user toggling Prompt Scanner to [OFF] in /gentle:customize
		const registeredModule = bus.get("chat-scanner")!;
		assert.ok(registeredModule, "Module must be registered in WiloxDev bus");
		const statusRow = registeredModule.rows.find((r) => r.id === "scanner-status")!;
		statusRow.action(); // Toggles enabled to false and triggers onConfigChanged

		// The editor component MUST be restored to Gentle Shell's factory, NOT undefined!
		assert.equal(
			mockEnv.getFactory(),
			gentlePromptFactory,
			"Gentle Shell's host editor factory must be restored when scanner is toggled off",
		);
		assert.equal(
			mockEnv.getWorkingVisible(),
			false,
			"Working visibility must remain false because Gentle Shell owns prompt",
		);
	} finally {
		cleanupTestConfigFile();
	}
});

test("lifecycle: falls back to undefined and workingVisible:true when no host editor was present", async () => {
	setupTestConfigFile(true);
	try {
		const mockEnv = createMockUIContext(undefined);
		mockEnv.setWorkingVisibleDirect(true);

		const pi = createMockPi();
		const bus = new Map<string, any>();
		(globalThis as any)[COMMUNITY_REGISTRY_SLOT] = bus;

		activate(pi as any);
		pi.emit("session_start", mockEnv.ctx);

		// Turn off scanner via community status row action
		const registeredModule = bus.get("chat-scanner")!;
		assert.ok(registeredModule);
		const statusRow = registeredModule.rows.find((r) => r.id === "scanner-status")!;
		statusRow.action(); // Toggles enabled to false

		assert.equal(mockEnv.getFactory(), undefined, "Should restore to undefined when no host factory existed");
		assert.equal(mockEnv.getWorkingVisible(), true, "Should restore workingVisible to true for default vanilla Pi");
	} finally {
		cleanupTestConfigFile();
	}
});

test("lifecycle: registers in community bus on startup even when enabled is false", async () => {
	setupTestConfigFile(false);
	try {
		const gentlePromptFactory: any = () => ({
			isGentlePrompt: true,
			dispose: () => {},
		});
		gentlePromptFactory[PROMPT_OWNER] = true;

		const mockEnv = createMockUIContext(gentlePromptFactory);
		mockEnv.setWorkingVisibleDirect(false);

		const pi = createMockPi();
		const bus = new Map<string, any>();
		(globalThis as any)[COMMUNITY_REGISTRY_SLOT] = bus;

		activate(pi as any);

		const registeredModule = bus.get("chat-scanner")!;
		assert.ok(registeredModule, "Must register in WiloxDev bus even when starting with enabled:false");
		assert.equal(registeredModule.rows.length, 1, "Only status row visible when disabled");
		assert.ok(registeredModule.rows[0].label().includes("[OFF]"));

		// Trigger session_start: should leave Gentle Shell editor untouched
		pi.emit("session_start", mockEnv.ctx);
		assert.equal(mockEnv.getFactory(), gentlePromptFactory, "Must not replace host editor when enabled:false");

		// Now enable it dynamically via UI status row action
		registeredModule.rows[0].action(); // Toggles enabled to true

		// Should now mount the scanner editor
		assert.notEqual(mockEnv.getFactory(), gentlePromptFactory, "Should mount scanner editor when toggled to on");
	} finally {
		cleanupTestConfigFile();
	}
});

test("lifecycle: handles multiple consecutive on/off toggles idempotently without leaking or corrupting host factory", async () => {
	setupTestConfigFile(true);
	try {
		const gentlePromptFactory: any = () => ({
			isGentlePrompt: true,
			dispose: () => {},
		});
		gentlePromptFactory[PROMPT_OWNER] = true;

		const mockEnv = createMockUIContext(gentlePromptFactory);
		mockEnv.setWorkingVisibleDirect(false);

		const pi = createMockPi();
		const bus = new Map<string, any>();
		(globalThis as any)[COMMUNITY_REGISTRY_SLOT] = bus;

		activate(pi as any);
		pi.emit("session_start", mockEnv.ctx);

		const registeredModule = bus.get("chat-scanner")!;
		assert.ok(registeredModule);
		const scannerFactory = mockEnv.getFactory();
		assert.notEqual(scannerFactory, gentlePromptFactory);

		// Toggle OFF -> ON -> OFF -> ON -> OFF
		for (let i = 0; i < 3; i++) {
			// Toggle to OFF
			const statusRow = registeredModule.rows.find((r) => r.id === "scanner-status")!;
			statusRow.action();
			assert.equal(mockEnv.getFactory(), gentlePromptFactory, `Iteration ${i}: Must restore gentlePromptFactory on OFF`);
			assert.equal(mockEnv.getWorkingVisible(), false, `Iteration ${i}: Must keep workingVisible:false for Gentle Shell`);

			// Toggle to ON
			const statusRowOn = registeredModule.rows.find((r) => r.id === "scanner-status")!;
			statusRowOn.action();
			const activeFactory = mockEnv.getFactory();
			assert.notEqual(activeFactory, gentlePromptFactory, `Iteration ${i}: Must mount scanner factory on ON`);
			assert.equal(mockEnv.getWorkingVisible(), false, `Iteration ${i}: Must keep workingVisible:false`);
		}

		// Final toggle to OFF
		registeredModule.rows.find((r) => r.id === "scanner-status")!.action();
		assert.equal(mockEnv.getFactory(), gentlePromptFactory, "Final state: gentlePromptFactory preserved cleanly");
	} finally {
		cleanupTestConfigFile();
	}
});

test("lifecycle: session_shutdown clears memory and resets state cleanly", async () => {
	setupTestConfigFile(true);
	try {
		const gentlePromptFactory: any = () => ({
			isGentlePrompt: true,
			dispose: () => {},
		});
		gentlePromptFactory[PROMPT_OWNER] = true;

		const mockEnv = createMockUIContext(gentlePromptFactory);
		const pi = createMockPi();
		const bus = new Map<string, any>();
		(globalThis as any)[COMMUNITY_REGISTRY_SLOT] = bus;

		activate(pi as any);
		pi.emit("session_start", mockEnv.ctx);

		// Simulate session shutdown
		pi.emit("session_shutdown");

		// After shutdown, if another session starts, it should capture the new session's host factory cleanly
		const secondHostFactory: any = () => ({ isSecondHost: true });
		secondHostFactory[PROMPT_OWNER] = true;
		const secondMockEnv = createMockUIContext(secondHostFactory);

		pi.emit("session_start", secondMockEnv.ctx);
		assert.notEqual(secondMockEnv.getFactory(), secondHostFactory);

		// Toggle OFF in second session: should restore secondHostFactory, NOT the previous session's host factory
		const registeredModule = bus.get("chat-scanner")!;
		registeredModule.rows.find((r) => r.id === "scanner-status")!.action();
		assert.equal(secondMockEnv.getFactory(), secondHostFactory, "Must restore the current session's host factory");
	} finally {
		cleanupTestConfigFile();
	}
});

