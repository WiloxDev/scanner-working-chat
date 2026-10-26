import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { loadConfig } from "./config.js";
import { ScannerWorkingEditor } from "./ScannerWorkingEditor.js";

/**
 * Entry point for Gentle-Pi and Gentle-Shell extension runtime.
 */
export default function activate(pi: ExtensionAPI): void {
	const config = loadConfig();
	if (config.enabled === false) {
		return;
	}

	pi.on("session_start", (_event, ctx) => {
		if (!ctx?.hasUI || typeof ctx.ui?.setEditorComponent !== "function") {
			return;
		}

		try {
			ctx.ui.setEditorComponent((tui, theme, keybindings) => {
				return new ScannerWorkingEditor(tui, theme, keybindings, ctx, config);
			});
		} catch (err) {
			console.error("[scanner-working-chat] Failed to install custom prompt editor:", err);
		}
	});
}
