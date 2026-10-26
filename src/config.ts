import { existsSync, readFileSync } from "node:fs";
import { homedir, userInfo } from "node:os";
import { join } from "node:path";
import { detectTerminalProfile, TerminalProfile } from "./terminal-detect.js";

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
	zenMode: boolean;
	showWorkingDuration: boolean;
	showCompactionCount: boolean;
	compactionIcon: string;
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
	configValidationErrors?: string[];
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

export function resolveDefaultUsername(): string {
	try {
		const info = userInfo();
		if (info?.username && info.username.trim().length > 0) return info.username.trim();
	} catch {
		// ignore
	}
	return (process.env.USER || process.env.USERNAME || "user").trim();
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

export function buildDefaultConfig(terminal: TerminalProfile = detectTerminalProfile()): ScannerChatConfig {
	return {
		enabled: true,
		zenMode: false,
		showWorkingDuration: true,
		showCompactionCount: true,
		compactionIcon: terminal.recommendedCompactionIcon,
		username: resolveDefaultUsername(),
		userIcon: terminal.recommendedUserIcon,
		flowerIcon: terminal.recommendedFlowerIcon,
		showContextInIdle: true,
		enableComet: true,
		cometSpeedMs: 80,
		cometTrackWidth: 22,
		cometGlyphs: [...terminal.recommendedCometGlyphs],
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
}

export const DEFAULT_CONFIG: ScannerChatConfig = buildDefaultConfig();

export interface LoadConfigOptions {
	configPath?: string;
	terminal?: TerminalProfile;
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

export function validateAndSanitizeConfig(rawObj: unknown): { sanitized: Record<string, any>; errors: string[] } {
	const errors: string[] = [];
	if (!rawObj || typeof rawObj !== "object" || Array.isArray(rawObj)) {
		return { sanitized: {}, errors: ["Root configuration must be a valid JSON object"] };
	}

	const input = rawObj as Record<string, any>;
	const sanitized: Record<string, any> = {};

	// Validate booleans
	for (const key of ["enabled", "zenMode", "showWorkingDuration", "showCompactionCount", "showContextInIdle", "enableComet"]) {
		if (key in input) {
			if (typeof input[key] === "boolean") {
				sanitized[key] = input[key];
			} else {
				errors.push(`Field '${key}' must be a boolean (got ${typeof input[key]})`);
			}
		}
	}

	// Validate strings
	for (const key of ["username", "userIcon", "flowerIcon", "compactionIcon"]) {
		if (key in input) {
			if (typeof input[key] === "string" && input[key].trim().length > 0) {
				sanitized[key] = input[key].trim();
			} else {
				errors.push(`Field '${key}' must be a non-empty string`);
			}
		}
	}

	// Validate numbers
	for (const key of ["cometSpeedMs", "cometTrackWidth", "warningThreshold", "criticalThreshold", "resetThreshold"]) {
		if (key in input) {
			const val = Number(input[key]);
			if (Number.isFinite(val) && val >= 0) {
				sanitized[key] = val;
			} else {
				errors.push(`Field '${key}' must be a positive number`);
			}
		}
	}

	// Threshold coherence
	const warn = sanitized.warningThreshold ?? input.warningThreshold;
	const crit = sanitized.criticalThreshold ?? input.criticalThreshold;
	if (typeof warn === "number" && typeof crit === "number" && warn >= crit) {
		errors.push(`'warningThreshold' (${warn}) must be less than 'criticalThreshold' (${crit})`);
	}

	// Validate cometGlyphs
	if ("cometGlyphs" in input) {
		if (Array.isArray(input.cometGlyphs) && input.cometGlyphs.length > 0 && input.cometGlyphs.every((g: any) => typeof g === "string")) {
			sanitized.cometGlyphs = input.cometGlyphs;
		} else {
			errors.push("'cometGlyphs' must be a non-empty array of strings");
		}
	}

	// Validate cometColors & spectrumColors
	for (const arrKey of ["cometColors", "spectrumColors"]) {
		if (arrKey in input) {
			if (Array.isArray(input[arrKey]) && input[arrKey].length > 0 && input[arrKey].every((c: any) => typeof c === "string")) {
				sanitized[arrKey] = input[arrKey];
			} else {
				errors.push(`'${arrKey}' must be an array of hex color strings`);
			}
		}
	}

	// Pass theme object if present
	if ("theme" in input && typeof input.theme === "object" && !Array.isArray(input.theme)) {
		sanitized.theme = input.theme;
	}

	return { sanitized, errors };
}

export function loadConfig(options: LoadConfigOptions = {}): ScannerChatConfig {
	const terminal = options.terminal || detectTerminalProfile();
	const baseDefaults = buildDefaultConfig(terminal);

	const defaultPath = join(homedir(), ".scanner-chatrc.json");
	const configPath = options.configPath || process.env.SCANNER_CHAT_CONFIG || defaultPath;

	let parsed: any = {};
	let configValidationErrors: string[] = [];

	if (existsSync(configPath)) {
		try {
			const raw = readFileSync(configPath, "utf8");
			const parsedJson = JSON.parse(raw);
			const validation = validateAndSanitizeConfig(parsedJson);
			parsed = validation.sanitized;
			configValidationErrors = validation.errors;
		} catch (err) {
			configValidationErrors = [`Failed to read or parse ${configPath}: ${err instanceof Error ? err.message : String(err)}`];
		}
	}

	const overrides = options.overrides || {};
	const user = overrides.username ?? parsed.username ?? baseDefaults.username;
	const userIcon = overrides.userIcon ?? parsed.userIcon ?? baseDefaults.userIcon;
	const flowerIcon = overrides.flowerIcon ?? parsed.flowerIcon ?? baseDefaults.flowerIcon;
	const compactionIcon = overrides.compactionIcon ?? parsed.compactionIcon ?? baseDefaults.compactionIcon;
	const enabled = overrides.enabled ?? parsed.enabled ?? baseDefaults.enabled;
	const zenMode = overrides.zenMode ?? parsed.zenMode ?? baseDefaults.zenMode;
	const showWorkingDuration = overrides.showWorkingDuration ?? parsed.showWorkingDuration ?? baseDefaults.showWorkingDuration;
	const showCompactionCount = overrides.showCompactionCount ?? parsed.showCompactionCount ?? baseDefaults.showCompactionCount;
	const showContextInIdle = overrides.showContextInIdle ?? parsed.showContextInIdle ?? baseDefaults.showContextInIdle;

	// Check environment variable GENTLE_PI_WORKING_COMET
	let envComet: boolean | undefined;
	if (process.env.GENTLE_PI_WORKING_COMET !== undefined) {
		const val = process.env.GENTLE_PI_WORKING_COMET.trim().toLowerCase();
		envComet = !(val === "0" || val === "false" || val === "off");
	}

	const enableComet = envComet ?? overrides.enableComet ?? parsed.enableComet ?? baseDefaults.enableComet;
	const cometSpeedMs = overrides.cometSpeedMs ?? parsed.cometSpeedMs ?? baseDefaults.cometSpeedMs;
	const cometTrackWidth = overrides.cometTrackWidth ?? parsed.cometTrackWidth ?? baseDefaults.cometTrackWidth;
	const warningThreshold = overrides.warningThreshold ?? parsed.warningThreshold ?? baseDefaults.warningThreshold;
	const criticalThreshold = overrides.criticalThreshold ?? parsed.criticalThreshold ?? baseDefaults.criticalThreshold;
	const resetThreshold = overrides.resetThreshold ?? parsed.resetThreshold ?? baseDefaults.resetThreshold;

	// Parse cometGlyphs
	let cometGlyphs = baseDefaults.cometGlyphs;
	if (overrides.cometGlyphs) {
		cometGlyphs = overrides.cometGlyphs;
	} else if (parsed.cometGlyphs && Array.isArray(parsed.cometGlyphs)) {
		cometGlyphs = parsed.cometGlyphs;
	}

	// Parse cometColors
	let cometColors = baseDefaults.cometColors;
	if (overrides.cometColors && Array.isArray(overrides.cometColors)) {
		cometColors = (overrides.cometColors as string[]).map((c) => hexToRgb(c, [0, 0, 0]));
	} else if (parsed.cometColors && Array.isArray(parsed.cometColors)) {
		cometColors = (parsed.cometColors as string[]).map((c) => hexToRgb(c, [0, 0, 0]));
	}

	// Parse spectrumColors
	let spectrumColors = baseDefaults.spectrumColors;
	if (overrides.spectrumColors && Array.isArray(overrides.spectrumColors)) {
		spectrumColors = (overrides.spectrumColors as string[]).map((c) => hexToRgb(c, [0, 0, 0]));
	} else if (parsed.spectrumColors && Array.isArray(parsed.spectrumColors)) {
		spectrumColors = (parsed.spectrumColors as string[]).map((c) => hexToRgb(c, [0, 0, 0]));
	}

	const themeData = overrides.theme || parsed.theme || {};
	const colors: ScannerChatThemeColors = {
		borderColor: themeData.borderColor
			? hexToRgb(themeData.borderColor, baseDefaults.colors.borderColor)
			: baseDefaults.colors.borderColor,
		userNameColor: themeData.userNameColor
			? hexToRgb(themeData.userNameColor, baseDefaults.colors.userNameColor)
			: baseDefaults.colors.userNameColor,
		flowerColor: themeData.flowerColor
			? hexToRgb(themeData.flowerColor, baseDefaults.colors.flowerColor)
			: baseDefaults.colors.flowerColor,
		separatorColor: themeData.separatorColor
			? hexToRgb(themeData.separatorColor, baseDefaults.colors.separatorColor)
			: baseDefaults.colors.separatorColor,
		labelColor: themeData.labelColor
			? hexToRgb(themeData.labelColor, baseDefaults.colors.labelColor)
			: baseDefaults.colors.labelColor,
		emptyCellColor: themeData.emptyCellColor
			? hexToRgb(themeData.emptyCellColor, baseDefaults.colors.emptyCellColor)
			: baseDefaults.colors.emptyCellColor,
		neonRedPulseBase: themeData.neonRedPulseBase
			? hexToRgb(themeData.neonRedPulseBase, baseDefaults.colors.neonRedPulseBase)
			: baseDefaults.colors.neonRedPulseBase,
		neonRedPulsePeak: themeData.neonRedPulsePeak
			? hexToRgb(themeData.neonRedPulsePeak, baseDefaults.colors.neonRedPulsePeak)
			: baseDefaults.colors.neonRedPulsePeak,
	};

	return {
		enabled,
		zenMode,
		showWorkingDuration,
		showCompactionCount,
		compactionIcon,
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
		configValidationErrors: configValidationErrors.length > 0 ? configValidationErrors : undefined,
	};
}
