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
			return `${c.enabled ? "Active" : "Disabled"} · ${c.username} · ${c.zenMode ? "Zen" : "Dynamic"}`;
		},
		get rows() {
			const c = getConfig();
			const statusRow: WiloxCommunityRow = {
				id: "scanner-status",
				label: () => `Prompt Scanner: [${getConfig().enabled ? "ON" : "OFF"}]`,
				preview: () => {
					const cfg = getConfig();
					return {
						title: "Chat Scanner · Master Status",
						sample: cfg.enabled
							? "[ACTIVE] Control activo de la barra de chat con escáner cinético y cometa."
							: "[OFF] Barra nativa de Gentle Shell activa. Scanner en reposo.",
					};
				},
				action: () => {
					const cfg = getConfig();
					applyPatchAndNotify({ enabled: !cfg.enabled });
				},
			};

			// Si Prompt Scanner está apagado, ocultar todas las opciones hijas
			if (!c.enabled) {
				return [statusRow];
			}

			return [
				statusRow,
				{
					id: "scanner-badge-name",
					label: () => {
						const cfg = getConfig();
						return `Badge Identity: [${cfg.username}]`;
					},
					preview: () => {
						const cfg = getConfig();
						return {
							title: "Chat Scanner · Badge Identity",
							sample: `[IDLE] ╭─ 󰣇 ${cfg.username} ✿  󰣇 Ctx: 24% [ 󰁨×1 ] ─────────────────────────────────────────╮\nFirma visual mostrada en el borde superior en modo reposo.`,
						};
					},
					action: async (inline?: any) => {
						const cfg = getConfig();
						if (inline && typeof inline.input === "function") {
							const inputName = await inline.input({ prompt: "Badge Identity", value: cfg.username });
							if (inputName && inputName.trim()) {
								applyPatchAndNotify({ username: inputName.trim() });
							}
						} else {
							const nextName = cfg.username === "Wilox" ? (process.env.HOSTNAME || "archlinux") : "Wilox";
							applyPatchAndNotify({ username: nextName });
						}
					},
				},
				{
					id: "scanner-comet",
					label: () => {
						const cfg = getConfig();
						return `Working Comet: [${cfg.zenMode ? "OFF" : "ON"}]`;
					},
					preview: () => ({
						title: "Chat Scanner · Working Comet",
						sample: `[WORKING] ╭── ◆●•∙·  ✿ exploring… │ [2.8s] │ 󰁨×1 │ Context ▰▰▱▱▱▱▱▱ 24% ──────╮\nCometa cinético LTR de 10 columnas en ejecuciones activas.`,
					}),
					action: () => {
						const cfg = getConfig();
						applyPatchAndNotify({ zenMode: !cfg.zenMode });
					},
				},
				{
					id: "scanner-context",
					label: () => {
						const cfg = getConfig();
						const show = cfg.showWorkingContext && cfg.showContextInIdle;
						return `Context Gauge: [${show ? "Full" : "Hidden"}]`;
					},
					preview: () => ({
						title: "Chat Scanner · Context Gauge",
						sample: `[GAUGE] Muestra medidor cromático de 8 niveles en IDLE y WORKING.`,
					}),
					action: () => {
						const cfg = getConfig();
						const next = !(cfg.showWorkingContext && cfg.showContextInIdle);
						applyPatchAndNotify({
							showWorkingContext: next,
							showContextInIdle: next,
						});
					},
				},
				{
					id: "scanner-duration",
					label: () => {
						const cfg = getConfig();
						return `Duration Badge: [${cfg.showWorkingDuration ? "ON" : "OFF"}]`;
					},
					preview: () => ({
						title: "Chat Scanner · Duration Badge",
						sample: `[DURATION] Tiempo de ejecución transcurrido [3.4s] en tareas activas.`,
					}),
					action: () => {
						const cfg = getConfig();
						applyPatchAndNotify({ showWorkingDuration: !cfg.showWorkingDuration });
					},
				},
				{
					id: "scanner-compaction",
					label: () => {
						const cfg = getConfig();
						return `Compaction Badge: [${cfg.showCompactionCount ? "ON" : "OFF"}]`;
					},
					preview: () => ({
						title: "Chat Scanner · Compaction Badge",
						sample: `[COMPACTION] Contador de compactaciones acumuladas de la sesión [󰁨×n].`,
					}),
					action: () => {
						const cfg = getConfig();
						applyPatchAndNotify({ showCompactionCount: !cfg.showCompactionCount });
					},
				},
				{
					id: "scanner-zen",
					label: () => {
						const cfg = getConfig();
						return `Zen Mode: [${cfg.zenMode ? "ON" : "OFF"}]`;
					},
					preview: () => ({
						title: "Chat Scanner · Zen Mode",
						sample: `[ZEN] Pausa cometas y texto cinético; estilo estático con 0% CPU.`,
					}),
					action: () => {
						const cfg = getConfig();
						applyPatchAndNotify({ zenMode: !cfg.zenMode });
					},
				},
			];
		},
	});
}
