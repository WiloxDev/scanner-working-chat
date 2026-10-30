import test from "node:test";
import assert from "node:assert/strict";
import {
	registerChatScannerModule,
	COMMUNITY_REGISTRY_SLOT,
	type WiloxCommunityModule,
} from "../src/wilox-community.js";
import { loadConfig } from "../src/config.js";

test("wilox-community module registers cleanly in global registry bus", () => {
	const dummyConfig = loadConfig();
	let notifiedConfig: any = null;

	registerChatScannerModule(
		() => dummyConfig,
		(cfg) => {
			notifiedConfig = cfg;
		}
	);

	const bus = (globalThis as any)[COMMUNITY_REGISTRY_SLOT] as Map<string, WiloxCommunityModule>;
	assert.ok(bus, "Global community registry Map should exist");
	assert.ok(bus.has("chat-scanner"), "chat-scanner module should be registered");

	const mod = bus.get("chat-scanner")!;
	assert.equal(mod.id, "chat-scanner");
	assert.equal(mod.title, "Chat Scanner & Working Comet");
	assert.equal(mod.order, 20);

	// Check summary
	const summary = mod.summary();
	assert.ok(summary.includes(dummyConfig.username));

	// Check rows
	assert.ok(Array.isArray(mod.rows));
	assert.ok(mod.rows.length >= 6);

	const ids = mod.rows.map((r) => r.id);
	assert.ok(ids.includes("scanner-badge-name"));
	assert.ok(ids.includes("scanner-comet"));
	assert.ok(ids.includes("scanner-context"));
	assert.ok(ids.includes("scanner-duration"));
	assert.ok(ids.includes("scanner-compaction"));
	assert.ok(ids.includes("scanner-zen"));

	// Check label and preview formatting
	const cometRow = mod.rows.find((r) => r.id === "scanner-comet")!;
	assert.ok(cometRow.label().includes("Working Comet:"));
	const preview = cometRow.preview();
	assert.equal(preview.title, "Chat Scanner · Working Comet");
	assert.ok(preview.sample.includes("[WORKING]"));
});
