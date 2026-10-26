import { GAUGE_CELLS } from "./shell-gauge.js";

export const DEFAULT_CONTEXT_WARNING_THRESHOLD = 70;
export const DEFAULT_CONTEXT_CRITICAL_THRESHOLD = 90;
export const DEFAULT_CONTEXT_ALERT_RESET_THRESHOLD = 15;

export interface SpectrumConfig {
	cellColors: readonly (readonly [number, number, number])[];
	emptyCellColor: readonly [number, number, number];
	labelColor: readonly [number, number, number];
	neonRedPulseBase: readonly [number, number, number];
	neonRedPulsePeak: readonly [number, number, number];
	warningThreshold: number;
	criticalThreshold: number;
	resetThreshold: number;
}

export const DEFAULT_SPECTRUM_CONFIG: SpectrumConfig = {
	cellColors: [
		[74, 222, 128],  // 1: #4ADE80 Verde Esmeralda (0-12%)
		[132, 204, 22],  // 2: #84CC16 Verde Lima (13-25%)
		[163, 230, 53],  // 3: #A3E635 Lima Brillante (26-37%)
		[234, 179, 8],   // 4: #EAB308 Amarillo Cálido (38-50%)
		[245, 158, 11],  // 5: #F59E0B Ámbar / Oro (51-62%)
		[249, 115, 22],  // 6: #F97316 Naranja Alerta (63-75%)
		[239, 68, 68],   // 7: #EF4444 Rojo Alerta (76-87%)
		[220, 38, 38],   // 8: #DC2626 Rojo Fuego Máximo (88-100%+)
	] as const,
	emptyCellColor: [70, 85, 100],
	labelColor: [92, 184, 199],
	neonRedPulseBase: [120, 20, 35],
	neonRedPulsePeak: [255, 30, 68],
	warningThreshold: 70,
	criticalThreshold: 90,
	resetThreshold: 15,
};

export function formatIdleContextBadge(
	percent: number | null,
	criticalThreshold = DEFAULT_CONTEXT_CRITICAL_THRESHOLD,
	config?: Partial<SpectrumConfig>,
): string {
	if (percent === null) return "";
	const cfg = { ...DEFAULT_SPECTRUM_CONFIG, ...config };
	const percentVal = Math.max(0, Math.min(100, percent));
	const percentText = `${Math.round(percent)}%`;
	const cells = 8;
	const filledCount = Math.min(cells, Math.round((percentVal / 100) * cells));
	const lastIdx = Math.max(0, Math.min(cells - 1, filledCount - 1));
	const isAlarm = percentVal >= cfg.criticalThreshold;
	const [r, g, b] = isAlarm ? cfg.neonRedPulsePeak : cfg.cellColors[lastIdx];
	const bold = isAlarm ? "1;" : "";
	return `\x1b[${bold}38;2;${r};${g};${b}m${percentText}\x1b[0m`;
}

const RESET_FG = "\x1b[39m";

function ansiRgb(
	text: string,
	[r, g, b]: readonly [number, number, number],
	enabled: boolean,
): string {
	if (!enabled || process.env.NO_COLOR !== undefined) {
		return text;
	}
	return `\x1b[38;2;${r};${g};${b}m${text}${RESET_FG}`;
}

export type ContextMirrorTier = "full" | "short" | "percentOnly";

export interface PromptContextMirrorOptions {
	percent: number | null;
	alert?: boolean;
	pulseBright?: boolean;
	tick?: number;
	tier?: ContextMirrorTier;
	color?: boolean;
	criticalThreshold?: number;
	resetThreshold?: number;
	fg?: (role: string, text: string) => string;
	bold?: (text: string) => string;
	config?: Partial<SpectrumConfig>;
}

export function evaluateContextAlertState(
	currentPercent: number | null,
	previousAlertState: boolean,
	criticalThreshold = DEFAULT_CONTEXT_CRITICAL_THRESHOLD,
	resetThreshold = DEFAULT_CONTEXT_ALERT_RESET_THRESHOLD,
): boolean {
	if (currentPercent === null) return false;
	if (previousAlertState) {
		return currentPercent > resetThreshold;
	}
	return currentPercent >= criticalThreshold;
}

export function renderPromptContextMirror(
	options: PromptContextMirrorOptions,
): string {
	const {
		percent,
		tick = 0,
		tier = "full",
		color = true,
		criticalThreshold = DEFAULT_CONTEXT_CRITICAL_THRESHOLD,
		bold = (text) => text,
		config = {},
	} = options;

	const cfg = { ...DEFAULT_SPECTRUM_CONFIG, ...config };

	const percentVal = percent ?? 0;
	const percentText = percent === null ? "?%" : `${Math.round(percent)}%`;

	const isHazardActive = Boolean(options.alert || percentVal >= cfg.criticalThreshold);

	const hazardPhase = ((tick % 10) + 10) % 10;
	const hazardWave = Math.sin((hazardPhase / 10) * Math.PI * 2);
	const hazardNorm = (hazardWave + 1) / 2;
	const neonRedPulse: [number, number, number] = [
		Math.round(cfg.neonRedPulseBase[0] + (cfg.neonRedPulsePeak[0] - cfg.neonRedPulseBase[0]) * hazardNorm),
		Math.round(cfg.neonRedPulseBase[1] + (cfg.neonRedPulsePeak[1] - cfg.neonRedPulseBase[1]) * hazardNorm),
		Math.round(cfg.neonRedPulseBase[2] + (cfg.neonRedPulsePeak[2] - cfg.neonRedPulseBase[2]) * hazardNorm),
	];

	const clamped = Math.max(0, Math.min(100, percentVal));
	const filledCount = Math.min(GAUGE_CELLS, Math.round((clamped / 100) * GAUGE_CELLS));

	let styledGauge = "";
	for (let i = 0; i < GAUGE_CELLS; i++) {
		if (i < filledCount) {
			// Use warning threshold for amber transition (cells 5-6 = indices 4-5 = 51-75%)
			let cellColor = cfg.cellColors[i];
			if (!isHazardActive && percentVal >= cfg.warningThreshold && percentVal < cfg.criticalThreshold) {
				// In warning zone: blend towards amber/orange for cells 5-6
				if (i >= 4 && i <= 5) {
					const warningColor: [number, number, number] = [245, 158, 11]; // Amber
					const blendFactor = (percentVal - cfg.warningThreshold) / (cfg.criticalThreshold - cfg.warningThreshold);
					cellColor = [
						Math.round(cellColor[0] + (warningColor[0] - cellColor[0]) * blendFactor),
						Math.round(cellColor[1] + (warningColor[1] - cellColor[1]) * blendFactor),
						Math.round(cellColor[2] + (warningColor[2] - cellColor[2]) * blendFactor),
					] as [number, number, number];
				}
			}
			styledGauge += ansiRgb("▰", cellColor, color);
		} else {
			styledGauge += ansiRgb("▱", cfg.emptyCellColor, color);
		}
	}

	const lastIdx = Math.max(0, Math.min(GAUGE_CELLS - 1, filledCount - 1));
	const normalPercentColor = cfg.cellColors[lastIdx];
	const percentColor: readonly [number, number, number] = isHazardActive ? neonRedPulse : normalPercentColor;

	if (tier === "percentOnly") {
		const formattedPercent = ansiRgb(isHazardActive ? bold(percentText) : percentText, percentColor, color);
		return formattedPercent;
	}

	const label = tier === "short" ? "Ctx" : "Context";
	const styledLabel = ansiRgb(label, cfg.labelColor, color);
	const styledPercent = ansiRgb(isHazardActive ? bold(percentText) : percentText, percentColor, color);

	return `${styledLabel} ${styledGauge} ${styledPercent}`;
}