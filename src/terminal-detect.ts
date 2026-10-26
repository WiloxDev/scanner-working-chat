/**
 * Terminal environment and Unicode capability detection.
 * Determines if the terminal reliably supports UTF-8 and Nerd Fonts,
 * or requires pure ASCII fallbacks to prevent visual mojibake.
 */

export interface TerminalProfile {
	isUtf8: boolean;
	hasNerdFont: boolean;
	recommendedUserIcon: string;
	recommendedFlowerIcon: string;
	recommendedCometGlyphs: readonly string[];
	recommendedGaugeFull: string;
	recommendedGaugeEmpty: string;
}

export const ASCII_FALLBACK_PROFILE: TerminalProfile = {
	isUtf8: false,
	hasNerdFont: false,
	recommendedUserIcon: "@",
	recommendedFlowerIcon: "*",
	recommendedCometGlyphs: [">", "+", "*", ".", " "],
	recommendedGaugeFull: "#",
	recommendedGaugeEmpty: "-",
};

export const UNICODE_PROFILE: TerminalProfile = {
	isUtf8: true,
	hasNerdFont: false,
	recommendedUserIcon: "●",
	recommendedFlowerIcon: "✿",
	recommendedCometGlyphs: ["◆", "●", "•", "∙", "·"],
	recommendedGaugeFull: "▰",
	recommendedGaugeEmpty: "▱",
};

export const NERD_FONT_PROFILE: TerminalProfile = {
	isUtf8: true,
	hasNerdFont: true,
	recommendedUserIcon: "󰣇",
	recommendedFlowerIcon: "✿",
	recommendedCometGlyphs: ["◆", "●", "•", "∙", "·"],
	recommendedGaugeFull: "▰",
	recommendedGaugeEmpty: "▱",
};

/**
 * Detects current terminal environment capabilities based on standard environment variables.
 */
export function detectTerminalProfile(env: NodeJS.ProcessEnv = process.env): TerminalProfile {
	const lang = (env.LC_ALL || env.LC_CTYPE || env.LANG || "").toLowerCase();
	const isUtf8 = lang.includes("utf-8") || lang.includes("utf8");

	// If environment clearly doesn't declare UTF-8 and is running in basic dumb/console terminal
	const term = (env.TERM || "").toLowerCase();
	if (!isUtf8 && (term === "dumb" || term === "linux" || term === "")) {
		return ASCII_FALLBACK_PROFILE;
	}

	// Heuristics for Nerd Font presence:
	// Modern terminal emulators that bundle or commonly configure Nerd Fonts:
	// Ghostty, WezTerm, Kitty, Alacritty, Windows Terminal (WT_SESSION), VS Code terminal
	const termProgram = (env.TERM_PROGRAM || "").toLowerCase();
	const hasNerdFont =
		Boolean(env.WT_SESSION) || // Windows Terminal
		Boolean(env.GHOSTTY_RESOURCES_DIR) || // Ghostty
		termProgram.includes("ghostty") ||
		termProgram.includes("wezterm") ||
		termProgram.includes("kitty") ||
		termProgram.includes("vscode") ||
		Boolean(env.KITTY_WINDOW_ID) ||
		term.includes("kitty") ||
		term.includes("alacritty") ||
		Boolean(env.NERD_FONT); // Explicit override flag

	if (hasNerdFont) {
		return NERD_FONT_PROFILE;
	}

	// If UTF-8 is supported but Nerd Font is not verified, use standard Unicode symbols
	return isUtf8 ? UNICODE_PROFILE : ASCII_FALLBACK_PROFILE;
}
