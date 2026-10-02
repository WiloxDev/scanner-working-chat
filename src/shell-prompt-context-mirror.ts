import { GAUGE_CELLS } from "./shell-gauge.js";

export const DEFAULT_CONTEXT_WARNING_THRESHOLD = 70;
export const DEFAULT_CONTEXT_CRITICAL_THRESHOLD = 90;
export const DEFAULT_CONTEXT_ALERT_RESET_THRESHOLD = 15;

// Espectro de 8 celdas idéntico a wer3.png (Verde -> Lima -> Amarillo -> Naranja -> Rojo)
export const SPECTRUM_CELL_COLORS: readonly (readonly [number, number, number])[] = [
	[74, 222, 128],  // 1: #4ADE80 Verde Esmeralda (0-12%)
	[132, 204, 22],  // 2: #84CC16 Verde Lima (13-25%)
	[163, 230, 53],  // 3: #A3E635 Lima Brillante (26-37%)
	[234, 179, 8],   // 4: #EAB308 Amarillo Cálido (38-50%)
	[245, 158, 11],  // 5: #F59E0B Ámbar / Oro (51-62%)
	[249, 115, 22],  // 6: #F97316 Naranja Alerta (63-75%)
	[239, 68, 68],   // 7: #EF4444 Rojo Alerta (76-87% - en rojo a partir de 85%)
	[220, 38, 38],   // 8: #DC2626 Rojo Fuego Máximo (88-100%+)
];

export const EMPTY_CELL_COLOR: readonly [number, number, number] = [70, 85, 100]; // Gris metálico carril de wer3.png

export function formatIdleContextBadge(
	percent: number | null,
	criticalThreshold = DEFAULT_CONTEXT_CRITICAL_THRESHOLD,
): string {
	if (percent === null) return "";
	const percentVal = Math.max(0, Math.min(100, percent));
	const percentText = `${Math.round(percent)}%`;
	const cells = 8;
	const filledCount = Math.min(cells, Math.round((percentVal / 100) * cells));
	const lastIdx = Math.max(0, Math.min(cells - 1, filledCount - 1));
	const isAlarm = percentVal >= criticalThreshold;
	const [r, g, b] = isAlarm ? [255, 30, 68] : SPECTRUM_CELL_COLORS[lastIdx];
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
}

export function evaluateContextAlertState(
	currentPercent: number | null,
	previousAlertState: boolean,
	criticalThreshold = DEFAULT_CONTEXT_CRITICAL_THRESHOLD,
	resetThreshold = DEFAULT_CONTEXT_ALERT_RESET_THRESHOLD,
): boolean {
	if (currentPercent === null) return false;
	if (previousAlertState) {
		// Retención de alarma (latching): no para hasta que regrese cerca de cero (≤ 15%)
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
	} = options;

	const percentVal = percent ?? 0;
	const percentText = percent === null ? "?%" : `${Math.round(percent)}%`;

	// Alarma disparada a partir del umbral con retención ininterrumpida
	const isHazardActive = Boolean(options.alert || percentVal >= criticalThreshold);

	// Automotive hazard light wave: oscilación analógica suave (~1.0s) entre Rojo Neón Vivo (#FF1E44) y reposo
	const hazardPhase = ((tick % 10) + 10) % 10;
	const hazardWave = Math.sin((hazardPhase / 10) * Math.PI * 2);
	const hazardNorm = (hazardWave + 1) / 2; // 0..1
	const neonRedPulse: [number, number, number] = [
		Math.round(120 + (255 - 120) * hazardNorm),
		Math.round(20 + (30 - 20) * hazardNorm),
		Math.round(35 + (68 - 35) * hazardNorm),
	];

	// Espectro multicolor por celdas estilo wer3.png
	const clamped = Math.max(0, Math.min(100, percentVal));
	const filledCount = Math.min(GAUGE_CELLS, Math.round((clamped / 100) * GAUGE_CELLS));

	let styledGauge = "";
	for (let i = 0; i < GAUGE_CELLS; i++) {
		if (i < filledCount) {
			const cellColor = SPECTRUM_CELL_COLORS[i];
			styledGauge += ansiRgb("▰", cellColor, color);
		} else {
			styledGauge += ansiRgb("▱", EMPTY_CELL_COLOR, color);
		}
	}

	// El porcentaje toma el Rojo Neón Intermitente si la alarma está activa, o el color de la última celda encendida
	const lastIdx = Math.max(0, Math.min(GAUGE_CELLS - 1, filledCount - 1));
	const normalPercentColor = SPECTRUM_CELL_COLORS[lastIdx];
	const percentColor: readonly [number, number, number] = isHazardActive ? neonRedPulse : normalPercentColor;

	// La etiqueta Context se mantiene fija en cian pastel como ancla visual serena
	const labelColor: [number, number, number] = [92, 184, 199];

	if (tier === "percentOnly") {
		const formattedPercent = ansiRgb(isHazardActive ? bold(percentText) : percentText, percentColor, color);
		return formattedPercent;
	}

	const label = tier === "short" ? "Ctx" : "Context";
	const styledLabel = ansiRgb(label, labelColor, color);
	const styledPercent = ansiRgb(isHazardActive ? bold(percentText) : percentText, percentColor, color);

	return `${styledLabel} ${styledGauge} ${styledPercent}`;
}
