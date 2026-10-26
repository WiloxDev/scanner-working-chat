import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { loadConfig, type ScannerChatConfig } from "./config.js";
import { ScannerWorkingEditor } from "./ScannerWorkingEditor.js";

/**
 * Entry point for Gentle-Pi and Gentle-Shell extension runtime.
 */
export default function activate(pi: ExtensionAPI): void {
	let config: ScannerChatConfig = loadConfig();
	if (config.enabled === false) {
		return;
	}

	let currentEditor: ScannerWorkingEditor | null = null;

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

				return "Usage:\n  /scanner zen     - Toggle Zen Mode (pause/resume comet & animations)\n  /scanner reload  - Reload ~/.scanner-chatrc.json without restarting Pi";
			},
		});
	}

	pi.on("session_start", (_event, ctx) => {
		if (!ctx?.hasUI || typeof ctx.ui?.setEditorComponent !== "function") {
			return;
		}

		// Notify user if config had syntax or validation warnings
		if (config.configValidationErrors && config.configValidationErrors.length > 0) {
			const warningSummary = `[scanner-working-chat] Configuration warnings:\n${config.configValidationErrors.join("\n")}`;
			if (typeof ctx.ui?.notify === "function") {
				ctx.ui.notify(warningSummary, "warning");
			} else {
				console.warn(warningSummary);
			}
		}

		try {
			ctx.ui.setEditorComponent((tui, theme, keybindings) => {
				currentEditor = new ScannerWorkingEditor(tui, theme, keybindings, ctx, config);
				return currentEditor;
			});
		} catch (err) {
			console.error("[scanner-working-chat] Failed to install custom prompt editor:", err);
		}
	});
}
