import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { loadConfig, persistUserConfigPatch, type ScannerChatConfig } from "./config.js";
import { ScannerWorkingEditor } from "./ScannerWorkingEditor.js";
import { registerChatScannerModule } from "./wilox-community.js";

/**
 * Entry point for Gentle-Pi and Gentle-Shell extension runtime.
 */
export default function activate(pi: ExtensionAPI): void {
	let config: ScannerChatConfig = loadConfig();
	if (config.enabled === false) {
		return;
	}

	let currentEditor: ScannerWorkingEditor | null = null;
	let sessionIsAgentActive = false;
	let sessionWorkingStartTime: number | null = null;
	let currentContext: any = null;

	const setupEditor = (ctx: any) => {
		if (!ctx?.hasUI || typeof ctx.ui?.setEditorComponent !== "function") {
			return;
		}

		if (!config.enabled) {
			if (currentEditor) {
				currentEditor.dispose();
				currentEditor = null;
			}
			try {
				ctx.ui.setEditorComponent(undefined);
				ctx.ui.setWorkingVisible(true);
			} catch {}
			return;
		}

		try {
			ctx.ui.setEditorComponent((tui: any, theme: any, keybindings: any) => {
				if (currentEditor) {
					currentEditor.dispose();
				}
				currentEditor = new ScannerWorkingEditor(tui, theme, keybindings, ctx, config);
				if (sessionIsAgentActive) {
					currentEditor.setAgentActive(true, sessionWorkingStartTime ?? undefined);
				}
				return currentEditor;
			});
		} catch (err) {
			console.error("[scanner-working-chat] Failed to install custom prompt editor:", err);
		}
	};

	// Registrar y sincronizar en el bus global de Acordeón Modular de WiloxDev
	try {
		registerChatScannerModule(
			() => config,
			(newConfig) => {
				const previousEnabled = config.enabled;
				config = newConfig;
				if (currentContext) {
					setupEditor(currentContext);
				}
				if (currentEditor && previousEnabled === newConfig.enabled) {
					currentEditor.config = { ...config };
					currentEditor.updateBorderColor();
					(currentEditor as any).tui?.requestRender();
				}
			}
		);
	} catch (err) {
		console.warn("[scanner-working-chat] Error registrando módulo de comunidad WiloxDev:", err);
	}

	// Register interactive command /scanner to toggle Zen Mode or reload config on the fly
	if (typeof (pi as any).registerCommand === "function") {
		(pi as any).registerCommand("scanner", {
			description: "Manage scanner-working-chat (zen mode, reload, stats)",
			handler: async (args: string, ctx: any) => {
				const sub = (args || "").trim().toLowerCase();

				if (sub === "zen" || sub === "toggle") {
					config.zenMode = !config.zenMode;
					if (currentEditor) {
						currentEditor.config = { ...config };
					}
					const statusText = config.zenMode ? "🌸 Zen Mode ACTIVATED (animations disabled)" : "⚡ Dynamic Mode ACTIVATED (animations enabled)";
					ctx?.ui?.notify?.(statusText, "info");
					return statusText;
				}

				if (sub === "reload") {
					config = loadConfig();
					if (currentEditor) {
						currentEditor.config = { ...config };
						currentEditor.updateBorderColor();
					}
					const notifyMsg = config.configValidationErrors?.length
						? `⚠️ Config reloaded with warnings:\n${config.configValidationErrors.join("\n")}`
						: "✅ Scanner config reloaded cleanly";
					ctx?.ui?.notify?.(notifyMsg, config.configValidationErrors?.length ? "warning" : "info");
					return notifyMsg;
				}

				if (sub.startsWith("name ") || sub.startsWith("username ")) {
					const parts = (args || "").trim().split(/\s+/);
					const newName = parts.slice(1).join(" ").trim();
					if (!newName) {
						return "⚠️ Proporciona un nombre válido: /scanner name <nombre> (Ej: /scanner name Wilox)";
					}

					config.username = newName;
					if (currentEditor) {
						currentEditor.config = { ...config };
						(currentEditor as any).tui?.requestRender();
					}

					persistUserConfigPatch({ username: newName });
					const successMsg = `👤 Nombre actualizado a '${newName}' en el badge de chat.`;
					ctx?.ui?.notify?.(successMsg, "info");
					return successMsg;
				}

				if (sub === "ctx" || sub === "context") {
					// Toggle de ambos contextos (idle y working) para experiencia intuitiva
					const nextState = !(config.showWorkingContext && config.showContextInIdle);
					config.showWorkingContext = nextState;
					config.showContextInIdle = nextState;
					if (currentEditor) {
						currentEditor.config = { ...config };
						(currentEditor as any).tui?.requestRender();
					}
					persistUserConfigPatch({
						showWorkingContext: nextState,
						showContextInIdle: nextState,
					});
					const statusMsg = nextState
						? "📊 Medidor de Contexto ACTIVADO (visible en IDLE y WORKING)"
						: "📊 Medidor de Contexto DESACTIVADO (oculto en IDLE y WORKING)";
					ctx?.ui?.notify?.(statusMsg, "info");
					return statusMsg;
				}

				if (sub === "time" || sub === "duration") {
					config.showWorkingDuration = !config.showWorkingDuration;
					if (currentEditor) {
						currentEditor.config = { ...config };
						(currentEditor as any).tui?.requestRender();
					}
					persistUserConfigPatch({ showWorkingDuration: config.showWorkingDuration });
					const statusMsg = config.showWorkingDuration
						? "⏱️ Badge de tiempo [3.4s] ACTIVADO"
						: "⏱️ Badge de tiempo [3.4s] DESACTIVADO";
					ctx?.ui?.notify?.(statusMsg, "info");
					return statusMsg;
				}

				if (sub === "comp" || sub === "compaction") {
					config.showCompactionCount = !config.showCompactionCount;
					if (currentEditor) {
						currentEditor.config = { ...config };
						(currentEditor as any).tui?.requestRender();
					}
					persistUserConfigPatch({ showCompactionCount: config.showCompactionCount });
					const statusMsg = config.showCompactionCount
						? "󰁨 Badge de compactaciones (󰁨×n) ACTIVADO"
						: "󰁨 Badge de compactaciones (󰁨×n) DESACTIVADO";
					ctx?.ui?.notify?.(statusMsg, "info");
					return statusMsg;
				}

				if (sub === "identity" || sub === "user") {
					config.showWorkingIdentity = !config.showWorkingIdentity;
					if (currentEditor) {
						currentEditor.config = { ...config };
						(currentEditor as any).tui?.requestRender();
					}
					persistUserConfigPatch({ showWorkingIdentity: config.showWorkingIdentity });
					const statusMsg = config.showWorkingIdentity
						? `👤 Firma de usuario '${config.username}' ACTIVADA en modo working`
						: "👤 Firma de usuario OCULTA en modo working";
					ctx?.ui?.notify?.(statusMsg, "info");
					return statusMsg;
				}

				return "Comandos disponibles de /scanner:\n" +
					"  /scanner name <nombre>  - Cambiar tu nombre de badge (Ej: /scanner name Wilox)\n" +
					"  /scanner identity       - Ocultar o mostrar firma de usuario en modo working\n" +
					"  /scanner ctx            - Ocultar o mostrar medidor de contexto (Ctx / Context [■■□□])\n" +
					"  /scanner time           - Ocultar o mostrar badge de tiempo transcurrido [3.4s]\n" +
					"  /scanner comp           - Ocultar o mostrar contador de compactaciones 󰁨×n\n" +
					"  /scanner zen            - Alternar Zen Mode (pausar o reanudar cometa y animaciones)\n" +
					"  /scanner reload         - Recargar ~/.scanner-chatrc.json sin reiniciar Pi";
			},
		});
	}

	pi.on("session_start", (_event, ctx) => {
		currentContext = ctx;
		if (currentEditor) {
			currentEditor.dispose();
			currentEditor = null;
		}
		sessionIsAgentActive = false;
		sessionWorkingStartTime = null;

		// Notify user if config had syntax or validation warnings
		if (config.configValidationErrors && config.configValidationErrors.length > 0) {
			const warningSummary = `[scanner-working-chat] Configuration warnings:\n${config.configValidationErrors.join("\n")}`;
			if (typeof ctx.ui?.notify === "function") {
				ctx.ui.notify(warningSummary, "warning");
			} else {
				console.warn(warningSummary);
			}
		}

		setupEditor(ctx);
	});

	pi.on("session_shutdown", () => {
		if (currentEditor) {
			currentEditor.dispose();
			currentEditor = null;
		}
		sessionIsAgentActive = false;
		sessionWorkingStartTime = null;
	});

	// Lifecycle hooks for robust working state tracking & telemetry
	pi.on("agent_start", () => {
		sessionIsAgentActive = true;
		if (!sessionWorkingStartTime) {
			sessionWorkingStartTime = Date.now();
		}
		if (currentEditor) {
			currentEditor.setAgentActive(true, sessionWorkingStartTime);
		}
	});

	pi.on("turn_start", () => {
		sessionIsAgentActive = true;
		if (!sessionWorkingStartTime) {
			sessionWorkingStartTime = Date.now();
		}
		if (currentEditor) {
			currentEditor.setAgentActive(true, sessionWorkingStartTime);
		}
	});

	pi.on("agent_end", () => {
		// Interim boundary: agent is finishing current execution loop
		if (currentEditor) {
			currentEditor.setWaitingState(false);
		}
	});

	pi.on("agent_settled", () => {
		sessionIsAgentActive = false;
		sessionWorkingStartTime = null;
		if (currentEditor) {
			currentEditor.setAgentActive(false);
		}
	});

	// Contextual telemetry during tool execution
	pi.on("tool_execution_start", (event: any) => {
		const toolName = event?.toolName || "tool";
		if (currentEditor) {
			currentEditor.setCurrentAction(`${toolName}…`);
		}
	});

	pi.on("tool_execution_end", () => {
		if (currentEditor) {
			currentEditor.setCurrentAction("working…");
		}
	});

	// Listen to session_compact event if supported by Pi to bump compaction count
	if (typeof (pi as any).on === "function") {
		try {
			(pi as any).on("session_compact", () => {
				if (currentEditor) {
					currentEditor.compactionCount++;
				}
			});
		} catch {
			// ignore if event is not registered in this runtime
		}
	}
}
