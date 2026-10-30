import { homedir } from "node:os";
import { type ScannerChatConfig, persistUserConfigPatch, loadConfig } from "./config.js";

export const COMMUNITY_REGISTRY_SLOT = Symbol.for("gentle-pi.community.wiloxdev.registry");
export const COMMUNITY_EXPANDED_SLOT = Symbol.for("gentle-pi.community.wiloxdev.expanded");

export interface WiloxCommunityRow {
	id: string;
	label: () => string;
	preview: () => { title: string; sample: string };
	action: (inline?: any) => void | Promise<void>;
}

export interface WiloxCommunityModule {
	id: string;
	title: string;
	summary: () => string;
	order?: number;
	rows: WiloxCommunityRow[];
}

export type ConfigChangeCallback = (newConfig: ScannerChatConfig) => void;

/**
 * Registra y sincroniza el módulo de Chat Scanner en el bus en memoria
 * bajo el protocolo de Acordeón Modular de WiloxDev.
 */
export function registerChatScannerModule(
	getConfig: () => ScannerChatConfig,
	onConfigChanged?: ConfigChangeCallback
): void {
	const globalBus = globalThis as typeof globalThis & {
		[COMMUNITY_REGISTRY_SLOT]?: Map<string, WiloxCommunityModule>;
	};

	const registry = (globalBus[COMMUNITY_REGISTRY_SLOT] ??= new Map<string, WiloxCommunityModule>());

	const applyPatchAndNotify = (patch: Partial<ScannerChatConfig>) => {
		persistUserConfigPatch(patch);
		const refreshed = loadConfig();
		if (onConfigChanged) {
			onConfigChanged(refreshed);
		}
	};

	registry.set("chat-scanner", {
		id: "chat-scanner",
		title: "Chat Scanner & Working Comet",
		order: 20,
		summary: () => {
			const c = getConfig();
			return `${c.username} · ${c.zenMode ? "Zen Mode" : "Dynamic"}`;
		},
		rows: [
			{
				id: "scanner-badge-name",
				label: () => {
					const c = getConfig();
					return `Badge Identity: [${c.username}] ➔ Enter to change`;
				},
				preview: () => {
					const c = getConfig();
					return {
						title: "Chat Scanner · Badge Identity",
						sample: `[IDLE] ╭─ 󰣇 ${c.username} ✿  󰣇 Ctx: 24% [ 󰁨×1 ] ─────────────────────────────────────────╮`,
					};
				},
				action: async (inline?: any) => {
					const c = getConfig();
					if (inline && typeof inline.input === "function") {
						const inputName = await inline.input({ prompt: "Badge Identity", value: c.username });
						if (inputName && inputName.trim()) {
							applyPatchAndNotify({ username: inputName.trim() });
						}
					} else {
						const nextName = c.username === "Wilox" ? (process.env.HOSTNAME || "archlinux") : "Wilox";
						applyPatchAndNotify({ username: nextName });
					}
				},
			},
			{
				id: "scanner-comet",
				label: () => {
					const c = getConfig();
					return c.zenMode
						? "Working Comet: [OFF · Zen Mode] ➔ Enter to enable"
						: "Working Comet: [ON · 10 cols forward LTR] ➔ Enter to disable";
				},
				preview: () => ({
					title: "Chat Scanner · Working Comet",
					sample: `[WORKING] ╭── ◆●•∙·  ✿ exploring… │ [2.8s] │ 󰁨×1 │ Context ▰▰▱▱▱▱▱▱ 24% ──────╮`,
				}),
				action: () => {
					const c = getConfig();
					applyPatchAndNotify({ zenMode: !c.zenMode });
				},
			},
			{
				id: "scanner-context",
				label: () => {
					const c = getConfig();
					const show = c.showWorkingContext && c.showContextInIdle;
					return `Context Gauge: [${show ? "Visible · Full" : "Hidden"}] ➔ Enter to toggle`;
				},
				preview: () => ({
					title: "Chat Scanner · Context Gauge",
					sample: `[GAUGE] Muestra medidor cromático de 8 niveles en IDLE y WORKING.`,
				}),
				action: () => {
					const c = getConfig();
					const next = !(c.showWorkingContext && c.showContextInIdle);
					applyPatchAndNotify({
						showWorkingContext: next,
						showContextInIdle: next,
					});
				},
			},
			{
				id: "scanner-duration",
				label: () => {
					const c = getConfig();
					return `Duration Badge: [${c.showWorkingDuration ? "Visible [3.4s]" : "Hidden"}] ➔ Enter to toggle`;
				},
				preview: () => ({
					title: "Chat Scanner · Duration Badge",
					sample: `[DURATION] Muestra tiempo transcurrido en tiempo real en tareas activas.`,
				}),
				action: () => {
					const c = getConfig();
					applyPatchAndNotify({ showWorkingDuration: !c.showWorkingDuration });
				},
			},
			{
				id: "scanner-compaction",
				label: () => {
					const c = getConfig();
					return `Compaction Badge: [${c.showCompactionCount ? "Visible [󰁨×n]" : "Hidden"}] ➔ Enter to toggle`;
				},
				preview: () => ({
					title: "Chat Scanner · Compaction Badge",
					sample: `[COMPACTION] Muestra contador acumulado de compactaciones en la sesión.`,
				}),
				action: () => {
					const c = getConfig();
					applyPatchAndNotify({ showCompactionCount: !c.showCompactionCount });
				},
			},
			{
				id: "scanner-zen",
				label: () => {
					const c = getConfig();
					return `Zen Mode: [${c.zenMode ? "Active (Quiet)" : "Inactive (Dynamic)"}] ➔ Enter to toggle`;
				},
				preview: () => ({
					title: "Chat Scanner · Zen Mode",
					sample: `[ZEN] Pausa cometas y texto cinético; estilo minimalista y 0% uso de CPU.`,
				}),
				action: () => {
					const c = getConfig();
					applyPatchAndNotify({ zenMode: !c.zenMode });
				},
			},
		],
	});
}
