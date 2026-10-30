import { visibleWidth } from "@earendil-works/pi-tui";

export type Rgb = readonly [number, number, number];

export interface CometConfig {
	glyphs: readonly string[];
	colors: readonly Rgb[];
	trackWidth: number;
	frameMs: number;
	direction?: "ltr" | "rtl";
}

export const DEFAULT_COMET_CONFIG: CometConfig = {
	glyphs: ["◆", "●", "•", "∙", "·"] as const,
	colors: [
		[92, 184, 199], // ◆ #5CB8C7 Pastel Cyan (Core Glow)
		[78, 160, 178], // ● Pastel Soft Cyan
		[64, 135, 155], // • Pastel Ocean
		[48, 105, 125], // ∙ Pastel Slate
		[32, 75, 95],   // · Midnight Pastel
	] as const,
	trackWidth: 10,
	frameMs: 45,
	direction: "ltr",
};

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
	config?: Partial<CometConfig>;
}

export function renderWorkingComet({
	tick,
	width = DEFAULT_COMET_CONFIG.trackWidth,
	color = true,
	config = {},
}: WorkingCometRenderOptions): string {
	const glyphs = config.glyphs ?? DEFAULT_COMET_CONFIG.glyphs;
	const colors = config.colors ?? DEFAULT_COMET_CONFIG.colors;
	const direction = config.direction ?? DEFAULT_COMET_CONFIG.direction ?? "ltr";
	const trackWidth = Math.max(0, Math.floor(width ?? config.trackWidth ?? DEFAULT_COMET_CONFIG.trackWidth));

	if (trackWidth === 0) {
		return "";
	}

	const cells = Array<string>(trackWidth).fill(" ");
	const cometLength = glyphs.length;
	const cycleLength = trackWidth + cometLength;
	const phase = ((tick % cycleLength) + cycleLength) % cycleLength;

	if (direction === "rtl") {
		// Head spawns at the far right edge of the track and advances left.
		const headX = trackWidth - 1 - phase;
		for (let tailIndex = 0; tailIndex < cometLength; tailIndex += 1) {
			const x = headX + tailIndex;
			if (x < 0 || x >= trackWidth) {
				continue;
			}
			cells[x] = ansiRgb(
				glyphs[tailIndex],
				colors[tailIndex] ?? colors[colors.length - 1],
				color,
			);
		}
	} else {
		// Natural LTR: Head moves forward from left to right, trailing the fading tail behind it.
		// On tick 0, head enters at position 0.
		const headX = phase;
		for (let tailIndex = 0; tailIndex < cometLength; tailIndex += 1) {
			const x = headX - tailIndex;
			if (x < 0 || x >= trackWidth) {
				continue;
			}
			cells[x] = ansiRgb(
				glyphs[tailIndex],
				colors[tailIndex] ?? colors[colors.length - 1],
				color,
			);
		}
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