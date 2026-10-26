import { existsSync, readFileSync } from "node:fs";
import { homedir, userInfo } from "node:os";
import { join } from "node:path";

export interface ScannerChatThemeColors {
	borderColor: [number, number, number];
	userNameColor: [number, number, number];
	flowerColor: [number, number, number];
	separatorColor: [number, number, number];
	labelColor: [number, number, number];
	emptyCellColor: [number, number, number];
	neonRedPulseBase: [number, number, number];
	neonRedPulsePeak: [number, number, number];
}

export interface ScannerChatConfig {
	enabled: boolean;
	username: string;
	userIcon: string;
	flowerIcon: string;
	showContextInIdle: boolean;
	enableComet: boolean;
	cometSpeedMs: number;
	cometTrackWidth: number;
	cometGlyphs: string[];
	cometColors: [number, number, number][];
	warningThreshold: number;
	criticalThreshold: number;
	resetThreshold: number;
	spectrumColors: [number, number, number][];
	colors: ScannerChatThemeColors;
}

export function hexToRgb(hex: string, fallback: [number, number, number]): [number, number, number] {
	if (!hex || typeof hex !== "string") return fallback;
	const clean = hex.replace("#", "").trim();
	if (clean.length === 3) {
		const r = parseInt(clean[0] + clean[0], 16);
		const g = parseInt(clean[1] + clean[1], 16);
		const b = parseInt(clean[2] + clean[2], 16);
		if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return fallback;
		return [r, g, b];
	}
	if (clean.length === 6) {
		const r = parseInt(clean.slice(0, 2), 16);
		const g = parseInt(clean.slice(2, 4), 16);
		const b = parseInt(clean.slice(4, 6), 16);
		if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return fallback;
		return [r, g, b];
	}
	return fallback;
}

function resolveDefaultUsername(): string {
	try {
		const info = userInfo();
		if (info?.username) return info.username;
	} catch {
		// ignore
	}
	return process.env.USER || process.env.USERNAME || "Wilox";
}

export const DEFAULT_COMET_GLYPHS = ["◆", "●", "•", "∙", "·"] as const;
export const DEFAULT_COMET_COLORS: readonly [number, number, number][] = [
	[92, 184, 199], // ◆ #5CB8C7 Pastel Cyan
	[78, 160, 178], // ● Pastel Soft Cyan
	[64, 135, 155], // • Pastel Ocean
	[48, 105, 125], // ∙ Pastel Slate
	[32, 75, 95],   // · Midnight Pastel
] as const;

export const DEFAULT_SPECTRUM_COLORS: readonly [number, number, number][] = [
	[74, 222, 128],  // 1: #4ADE80 Verde Esmeralda (0-12%)
	[132, 204, 22],  // 2: #84CC16 Verde Lima (13-25%)
	[163, 230, 53],  // 3: #A3E635 Lima Brillante (26-37%)
	[234, 179, 8],   // 4: #EAB308 Amarillo Cálido (38-50%)
	[245, 158, 11],  // 5: #F59E0B Ámbar / Oro (51-62%)
	[249, 115, 22],  // 6: #F97316 Naranja Alerta (63-75%)
	[239, 68, 68],   // 7: #EF4444 Rojo Alerta (76-87%)
	[220, 38, 38],   // 8: #DC2626 Rojo Fuego Máximo (88-100%+)
] as const;

export const DEFAULT_EMPTY_CELL_COLOR: [number, number, number] = [70, 85, 100];
export const DEFAULT_LABEL_COLOR: [number, number, number] = [92, 184, 199];
export const DEFAULT_NEON_RED_PULSE_BASE: [number, number, number] = [120, 20, 35];
export const DEFAULT_NEON_RED_PULSE_PEAK: [number, number, number] = [255, 30, 68];

export const DEFAULT_CONFIG: ScannerChatConfig = {
	enabled: true,
	username: resolveDefaultUsername(),
	userIcon: "󰣇",
	flowerIcon: "✿",
	showContextInIdle: true,
	enableComet: true,
	cometSpeedMs: 80,
	cometTrackWidth: 22,
	cometGlyphs: [...DEFAULT_COMET_GLYPHS],
	cometColors: [...DEFAULT_COMET_COLORS],
	warningThreshold: 70,
	criticalThreshold: 90,
	resetThreshold: 15,
	spectrumColors: [...DEFAULT_SPECTRUM_COLORS],
	colors: {
		borderColor: [92, 184, 199],      // #5CB8C7 Pastel Cyan
		userNameColor: [123, 200, 143],   // #7BC88F Menta suave
		flowerColor: [92, 184, 199],     // #5CB8C7
		separatorColor: [138, 78, 158],   // #8A4E9E Violeta suave
		labelColor: [92, 184, 199],
		emptyCellColor: [70, 85, 100],
		neonRedPulseBase: [120, 20, 35],
		neonRedPulsePeak: [255, 30, 68],
	},
};

export interface LoadConfigOptions {
	configPath?: string;
	overrides?: Partial<ScannerChatConfig> & {
		theme?: {
			borderColor?: string;
			userNameColor?: string;
			flowerColor?: string;
			separatorColor?: string;
			labelColor?: string;
			emptyCellColor?: string;
			neonRedPulseBase?: string;
			neonRedPulsePeak?: string;
		};
		cometGlyphs?: string[];
		cometColors?: string[];
		spectrumColors?: string[];
	};
}

export function loadConfig(options: LoadConfigOptions = {}): ScannerChatConfig {
	const defaultPath = join(homedir(), ".scanner-chatrc.json");
	const configPath = options.configPath || process.env.SCANNER_CHAT_CONFIG || defaultPath;

	let parsed: any = {};
	if (existsSync(configPath)) {
		try {
			const raw = readFileSync(configPath, "utf8");
			parsed = JSON.parse(raw);
		} catch (err) {
			console.warn(`[scanner-working-chat] Warning: Failed to parse ${configPath}:`, err);
		}
	}

	const overrides = options.overrides || {};
	const user = overrides.username ?? parsed.username ?? DEFAULT_CONFIG.username;
	const userIcon = overrides.userIcon ?? parsed.userIcon ?? DEFAULT_CONFIG.userIcon;
	const flowerIcon = overrides.flowerIcon ?? parsed.flowerIcon ?? DEFAULT_CONFIG.flowerIcon;
	const enabled = overrides.enabled ?? parsed.enabled ?? DEFAULT_CONFIG.enabled;
	const showContextInIdle = overrides.showContextInIdle ?? parsed.showContextInIdle ?? DEFAULT_CONFIG.showContextInIdle;

	// Check environment variable GENTLE_PI_WORKING_COMET
	let envComet: boolean | undefined;
	if (process.env.GENTLE_PI_WORKING_COMET !== undefined) {
		const val = process.env.GENTLE_PI_WORKING_COMET.trim().toLowerCase();
		envComet = !(val === "0" || val === "false" || val === "off");
	}

	const enableComet = envComet ?? overrides.enableComet ?? parsed.enableComet ?? DEFAULT_CONFIG.enableComet;
	const cometSpeedMs = overrides.cometSpeedMs ?? parsed.cometSpeedMs ?? DEFAULT_CONFIG.cometSpeedMs;
	const cometTrackWidth = overrides.cometTrackWidth ?? parsed.cometTrackWidth ?? DEFAULT_CONFIG.cometTrackWidth;
	const warningThreshold = overrides.warningThreshold ?? parsed.warningThreshold ?? DEFAULT_CONFIG.warningThreshold;
	const criticalThreshold = overrides.criticalThreshold ?? parsed.criticalThreshold ?? DEFAULT_CONFIG.criticalThreshold;
	const resetThreshold = overrides.resetThreshold ?? parsed.resetThreshold ?? DEFAULT_CONFIG.resetThreshold;

	// Parse cometGlyphs from config (array of strings)
	let cometGlyphs = DEFAULT_CONFIG.cometGlyphs;
	if (overrides.cometGlyphs) {
		cometGlyphs = overrides.cometGlyphs;
	} else if (parsed.cometGlyphs && Array.isArray(parsed.cometGlyphs)) {
		cometGlyphs = parsed.cometGlyphs;
	}

	// Parse cometColors from config (array of hex strings -> RGB)
	let cometColors = DEFAULT_CONFIG.cometColors;
	if (overrides.cometColors && Array.isArray(overrides.cometColors)) {
		cometColors = (overrides.cometColors as string[]).map((c) => hexToRgb(c, [0, 0, 0]));
	} else if (parsed.cometColors && Array.isArray(parsed.cometColors)) {
		cometColors = (parsed.cometColors as string[]).map((c) => hexToRgb(c, [0, 0, 0]));
	}

	// Parse spectrumColors from config (array of hex strings -> RGB)
	let spectrumColors = DEFAULT_CONFIG.spectrumColors;
	if (overrides.spectrumColors && Array.isArray(overrides.spectrumColors)) {
		spectrumColors = (overrides.spectrumColors as string[]).map((c) => hexToRgb(c, [0, 0, 0]));
	} else if (parsed.spectrumColors && Array.isArray(parsed.spectrumColors)) {
		spectrumColors = (parsed.spectrumColors as string[]).map((c) => hexToRgb(c, [0, 0, 0]));
	}

	const themeData = overrides.theme || parsed.theme || {};
	const colors: ScannerChatThemeColors = {
		borderColor: themeData.borderColor
			? hexToRgb(themeData.borderColor, DEFAULT_CONFIG.colors.borderColor)
			: DEFAULT_CONFIG.colors.borderColor,
		userNameColor: themeData.userNameColor
			? hexToRgb(themeData.userNameColor, DEFAULT_CONFIG.colors.userNameColor)
			: DEFAULT_CONFIG.colors.userNameColor,
		flowerColor: themeData.flowerColor
			? hexToRgb(themeData.flowerColor, DEFAULT_CONFIG.colors.flowerColor)
			: DEFAULT_CONFIG.colors.flowerColor,
		separatorColor: themeData.separatorColor
			? hexToRgb(themeData.separatorColor, DEFAULT_CONFIG.colors.separatorColor)
			: DEFAULT_CONFIG.colors.separatorColor,
		labelColor: themeData.labelColor
			? hexToRgb(themeData.labelColor, DEFAULT_CONFIG.colors.labelColor)
			: DEFAULT_CONFIG.colors.labelColor,
		emptyCellColor: themeData.emptyCellColor
			? hexToRgb(themeData.emptyCellColor, DEFAULT_CONFIG.colors.emptyCellColor)
			: DEFAULT_CONFIG.colors.emptyCellColor,
		neonRedPulseBase: themeData.neonRedPulseBase
			? hexToRgb(themeData.neonRedPulseBase, DEFAULT_CONFIG.colors.neonRedPulseBase)
			: DEFAULT_CONFIG.colors.neonRedPulseBase,
		neonRedPulsePeak: themeData.neonRedPulsePeak
			? hexToRgb(themeData.neonRedPulsePeak, DEFAULT_CONFIG.colors.neonRedPulsePeak)
			: DEFAULT_CONFIG.colors.neonRedPulsePeak,
	};

	return {
		enabled,
		username: user,
		userIcon,
		flowerIcon,
		showContextInIdle,
		enableComet,
		cometSpeedMs,
		cometTrackWidth,
		cometGlyphs,
		cometColors,
		warningThreshold,
		criticalThreshold,
		resetThreshold,
		spectrumColors,
		colors,
	};
}