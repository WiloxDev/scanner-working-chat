import { visibleWidth } from "@earendil-works/pi-tui";

export type Rgb = readonly [number, number, number];

export const COMET_GLYPHS = ["◆", "●", "•", "∙", "·"] as const;

export const COMET_COLORS: readonly Rgb[] = [
	[92, 184, 199], // ◆ #5CB8C7 Pastel Cyan
	[78, 160, 178], // ● Pastel Soft Cyan
	[64, 135, 155], // • Pastel Ocean
	[48, 105, 125], // ∙ Pastel Slate
	[32, 75, 95],   // · Midnight Pastel
];

export const DEFAULT_COMET_TRACK_WIDTH = 10;
export const DEFAULT_COMET_FRAME_MS = 70;

const RESET_FG = "\x1b[39m";

function ansiRgb(text: string, [r, g, b]: Rgb, enabled: boolean): string {
	if (!enabled || process.env.NO_COLOR !== undefined) {
		return text;
	}
	return `\x1b[38;2;${r};${g};${b}m${text}${RESET_FG}`;
}

export interface WorkingCometRenderOptions {
	tick: number;
	width?: number;
	color?: boolean;
}

export function renderWorkingComet({
	tick,
	width = DEFAULT_COMET_TRACK_WIDTH,
	color = true,
}: WorkingCometRenderOptions): string {
	const trackWidth = Math.max(0, Math.floor(width));

	if (trackWidth === 0) {
		return "";
	}

	const cells = Array<string>(trackWidth).fill(" ");
	const cometLength = COMET_GLYPHS.length;
	const cycleLength = trackWidth + cometLength;
	const phase = ((tick % cycleLength) + cycleLength) % cycleLength;

	// Head spawns at the far right edge of the track.
	// Each tick advances one cell to the left.
	const headX = trackWidth - 1 - phase;

	for (let tailIndex = 0; tailIndex < cometLength; tailIndex += 1) {
		const x = headX + tailIndex;
		if (x < 0 || x >= trackWidth) {
			continue;
		}
		cells[x] = ansiRgb(
			COMET_GLYPHS[tailIndex],
			COMET_COLORS[tailIndex],
			color,
		);
	}

	const rendered = cells.join("");

	// Invariant: track always maintains the exact expected visible width.
	if (visibleWidth(rendered) !== trackWidth) {
		return " ".repeat(trackWidth);
	}

	return rendered;
}

export function isWorkingCometEnabled(): boolean {
	const env = process.env.GENTLE_PI_WORKING_COMET?.trim().toLowerCase();
	if (env === "0" || env === "false" || env === "off") {
		return false;
	}
	return true;
}
