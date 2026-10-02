import { existsSync, readFileSync } from "node:fs";
import { homedir, userInfo } from "node:os";
import { join } from "node:path";

export interface ScannerChatThemeColors {
	borderColor: [number, number, number];
	userNameColor: [number, number, number];
	flowerColor: [number, number, number];
	separatorColor: [number, number, number];
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
	warningThreshold: number;
	criticalThreshold: number;
	resetThreshold: number;
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

export const DEFAULT_CONFIG: ScannerChatConfig = {
	enabled: true,
	username: resolveDefaultUsername(),
	userIcon: "󰣇",
	flowerIcon: "✿",
	showContextInIdle: true,
	enableComet: true,
	cometSpeedMs: 80,
	cometTrackWidth: 22,
	warningThreshold: 70,
	criticalThreshold: 90,
	resetThreshold: 15,
	colors: {
		borderColor: [92, 184, 199],      // #5CB8C7 Pastel Cyan
		userNameColor: [123, 200, 143],   // #7BC88F Menta suave
		flowerColor: [92, 184, 199],     // #5CB8C7
		separatorColor: [138, 78, 158],   // #8A4E9E Violeta suave
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
		};
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
		warningThreshold,
		criticalThreshold,
		resetThreshold,
		colors,
	};
}
