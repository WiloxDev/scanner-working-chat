import { visibleWidth } from "@earendil-works/pi-tui";

export type Rgb = readonly [number, number, number];

export interface CometConfig {
	glyphs: readonly string[];
	colors: readonly Rgb[];
	trackWidth: number;
	frameMs: number;
	direction?: "ltr" | "rtl" | "alternate";
}

export const DEFAULT_COMET_CONFIG: CometConfig = {
	glyphs: ["▪", "▪", "▪", "▪", "▪"],
	colors: [
		[92, 184, 199],
		[78, 160, 178],
		[64, 135, 155],
		[48, 105, 125],
		[32, 75, 95],
	],
	trackWidth: 10,
	frameMs: 45,
	direction: "alternate",
};

const RESET_FG = "\x1b[39m";

function ansiRgb(text: string, [r, g, b]: Rgb, enabled: boolean): string {
	if (!enabled || process.env.NO_COLOR !== undefined) return text;
	return `\x1b[38;2;${r};${g};${b}m${text}${RESET_FG}`;
}

export interface WorkingCometRenderOptions {
	tick: number;
	width?: number;
	color?: boolean;
	config?: Partial<CometConfig>;
}

export function workingCometCycleLength(width: number, glyphCount: number, direction: CometConfig["direction"] = "alternate"): number {
	const trackWidth = Math.max(0, Math.floor(width));
	const passLength = trackWidth + glyphCount;
	return Math.max(1, direction === "alternate" ? 2 * passLength + trackWidth : passLength);
}

export function renderWorkingComet({
	tick,
	width = DEFAULT_COMET_CONFIG.trackWidth,
	color = true,
	config = {},
}: WorkingCometRenderOptions): string {
	const glyphs = config.glyphs ?? DEFAULT_COMET_CONFIG.glyphs;
	const colors = config.colors ?? DEFAULT_COMET_CONFIG.colors;
	const direction = config.direction ?? DEFAULT_COMET_CONFIG.direction ?? "alternate";
	const trackWidth = Math.max(0, Math.floor(width ?? config.trackWidth ?? DEFAULT_COMET_CONFIG.trackWidth));
	if (trackWidth === 0) return "";

	const trackColor = colors[colors.length - 1] ?? [32, 75, 95];
	const cells = Array<string>(trackWidth).fill(ansiRgb(".", trackColor, color));
	const passLength = trackWidth + glyphs.length;
	const cycleLength = workingCometCycleLength(trackWidth, glyphs.length, direction);
	const phase = ((Math.floor(tick) % cycleLength) + cycleLength) % cycleLength;
	const movingLeft = direction === "rtl" || (direction === "alternate" && phase >= passLength);
	const passPhase = direction === "alternate" && movingLeft ? phase - passLength : phase;
	const headX = movingLeft ? trackWidth - 1 - passPhase : passPhase;

	// After both passes the head and tail are outside the track: only dim dots remain.
	for (let tailIndex = 0; tailIndex < glyphs.length; tailIndex += 1) {
		const x = headX + (movingLeft ? tailIndex : -tailIndex);
		if (x < 0 || x >= trackWidth) continue;
		cells[x] = ansiRgb(glyphs[tailIndex], colors[tailIndex] ?? trackColor, color);
	}

	const rendered = cells.join("");
	return visibleWidth(rendered) === trackWidth ? rendered : " ".repeat(trackWidth);
}

export function isWorkingCometEnabled(): boolean {
	const env = process.env.GENTLE_PI_WORKING_COMET?.trim().toLowerCase();
	return env !== "0" && env !== "false" && env !== "off";
}
