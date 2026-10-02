import {
	CustomEditor,
	type ExtensionContext,
	type KeybindingsManager,
} from "@earendil-works/pi-coding-agent";
import type { EditorTheme, TUI } from "@earendil-works/pi-tui";
import { stripTerminalSequences, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import {
	isWorkingCometEnabled,
	renderWorkingComet,
} from "./shell-working-comet.js";
import {
	evaluateContextAlertState,
	formatIdleContextBadge,
	renderPromptContextMirror,
	type ContextMirrorTier,
} from "./shell-prompt-context-mirror.js";
import { type ScannerChatConfig, DEFAULT_CONFIG } from "./config.js";

const FLOWER_FRAMES = ["✿", "❀", "❁", "✾"] as const;

export function renderSyncFlower(tick: number, baseFlower = "✿", baseColor: [number, number, number] = [92, 184, 199]): string {
	const cycleLength = 15;
	const phase = ((tick % cycleLength) + cycleLength) % cycleLength;
	// When phase is 0-2 (comet emerging right from the flower), flash bright; then smoothly dim
	const t = Math.min(1, phase / 6);
	const r = Math.round(baseColor[0] + (35 - baseColor[0]) * t);
	const g = Math.round(baseColor[1] + (75 - baseColor[1]) * t);
	const b = Math.round(baseColor[2] + (95 - baseColor[2]) * t);
	const bold = phase <= 2 ? "1;" : "";

	let glyph = baseFlower;
	if (baseFlower === "✿") {
		glyph = FLOWER_FRAMES[Math.floor(tick / 2) % FLOWER_FRAMES.length];
	}
	return `\x1b[${bold}38;2;${r};${g};${b}m${glyph}\x1b[0m`;
}

export function scanWorkingText(text: string, tick: number): string {
	const steps = 15;
	const phase = ((Math.floor(tick) % steps) + steps) % steps;
	const head = phase - 2;
	return Array.from(text, (char, index) => {
		const dist = Math.abs(head - index);
		if (dist === 0) return `\x1b[1;38;2;92;184;199m${char}\x1b[0m`; // #5CB8C7 Pastel Cyan
		if (dist === 1) return `\x1b[38;2;123;200;143m${char}\x1b[0m`;  // #7BC88F Menta suave
		if (dist === 2) return `\x1b[38;2;138;78;158m${char}\x1b[0m`;   // #8A4E9E Violeta suave
		return `\x1b[38;2;90;120;135m${char}\x1b[0m`;                    // Pastel Slate Dim
	}).join("");
}

export function cleanStatusLabel(raw: string): string {
	const stripped = stripTerminalSequences(raw)
		.replace(/[\uE000-\uF8FF\uDB80-\uDBFF\uDC00-\uDFFF]/gu, "")
		.trim();
	if (!stripped) return "working…";
	if (stripped.toLowerCase().startsWith("working")) return "working…";
	return stripped.endsWith("…") || stripped.endsWith("...") ? stripped : `${stripped}…`;
}

function fitLine(text: string, width: number): string {
	if (width <= 0) return "";
	const vis = visibleWidth(text);
	if (vis <= width) {
		return text + " ".repeat(width - vis);
	}
	const clipped = truncateToWidth(text, width, "");
	const clippedVis = visibleWidth(clipped);
	return clipped + " ".repeat(Math.max(0, width - clippedVis));
}

const RESET = "\x1b[0m";

function boxedLine(line: string, innerWidth: number, left: string, right: string, border: (text: string) => string): string {
	return `${border(left)}${fitLine(line, innerWidth)}${border(right)}`;
}

function interpolateColor(
	c1: [number, number, number],
	c2: [number, number, number],
	t: number,
): [number, number, number] {
	return [
		Math.round(c1[0] + (c2[0] - c1[0]) * t),
		Math.round(c1[1] + (c2[1] - c1[1]) * t),
		Math.round(c1[2] + (c2[2] - c1[2]) * t),
	];
}

const COLOR_STOPS: [number, number, number][] = [
	[0, 229, 255],   // Electric Cyan (#00e5ff)
	[23, 147, 209],  // Arch Blue (#1793d1)
	[155, 92, 255],  // Cyber Violet (#9b5cff)
	[255, 45, 247],  // Neon Pink (#ff2df7)
	[255, 184, 77],  // Electric Amber (#ffb84d)
	[102, 255, 102], // Neon Green (#66ff66)
];

export function createWorkingFrames(icon = "󰣇", totalFrames = 12): string[] {
	const frames: string[] = [];
	for (let i = 0; i < totalFrames; i++) {
		const colorProgress = i / totalFrames;
		const stopIndex = Math.floor(colorProgress * COLOR_STOPS.length);
		const nextStopIndex = (stopIndex + 1) % COLOR_STOPS.length;
		const stopT = colorProgress * COLOR_STOPS.length - stopIndex;
		const baseColor = interpolateColor(COLOR_STOPS[stopIndex], COLOR_STOPS[nextStopIndex], stopT);

		// Breathing wave
		const wave = Math.sin(colorProgress * Math.PI * 2);
		const normWave = (wave + 1) / 2;
		const brightness = 0.4 + 0.6 * Math.pow(normWave, 1.2);

		let r = Math.round(baseColor[0] * brightness);
		let g = Math.round(baseColor[1] * brightness);
		let b = Math.round(baseColor[2] * brightness);

		if (normWave > 0.75) {
			const highlightT = ((normWave - 0.75) / 0.25) * 0.35;
			r = Math.min(255, Math.round(r * (1 - highlightT) + 255 * highlightT));
			g = Math.min(255, Math.round(g * (1 - highlightT) + 255 * highlightT));
			b = Math.min(255, Math.round(b * (1 - highlightT) + 255 * highlightT));
		}

		const bold = brightness > 0.5 ? "1;" : "";
		frames.push(`\x1b[${bold}38;2;${r};${g};${b}m${icon}${RESET}`);
	}
	return frames;
}

export const ARCH_WORKING_INDICATOR = {
	frames: createWorkingFrames("󰣇", 12),
	intervalMs: 100,
};

export class ScannerWorkingEditor extends CustomEditor {
	private alertState = false;
	private readonly ctx?: ExtensionContext;
	private readonly config: ScannerChatConfig;

	constructor(
		tui: TUI,
		theme: EditorTheme,
		keybindings: KeybindingsManager,
		ctx?: ExtensionContext,
		config: ScannerChatConfig = DEFAULT_CONFIG,
	) {
		super(tui, theme, keybindings, { embedWorkingStatus: true });
		this.ctx = ctx;
		this.config = config;

		const [br, bg, bb] = config.colors.borderColor;
		this.borderColor = (text: string) => `\x1b[38;2;${br};${bg};${bb}m${text}${RESET}`;
	}

	override setWorkingStatusIndicator(indicator: any): void {
		if (indicator && typeof indicator.setIndicator === "function") {
			indicator.setIndicator({
				frames: createWorkingFrames(this.config.userIcon, 12),
				intervalMs: 100,
			});
			indicator._hasArchIndicator = true;
		}
		super.setWorkingStatusIndicator(indicator);
	}

	protected override renderTopBorder(width: number, hiddenLineCount: number): string {
		if (width <= 0) return "";

		const wsi = (this as any).workingStatusIndicator;
		let status = "";

		if (this.embedWorkingStatus && wsi) {
			if (typeof wsi.setIndicator === "function" && !wsi._hasArchIndicator) {
				wsi.setIndicator({
					frames: createWorkingFrames(this.config.userIcon, 12),
					intervalMs: 100,
				});
				wsi._hasArchIndicator = true;
			}

			const rawStatus = wsi.renderInBorder?.(Math.max(1, width - 8)) ?? "";
			const tick = wsi.currentFrame ?? 0;

			if (rawStatus) {
				const comet = (this.config.enableComet && isWorkingCometEnabled())
					? renderWorkingComet({ tick, width: this.config.cometTrackWidth, color: true })
					: "";

				let contextStr = "";
				if (this.ctx) {
					const usage = this.ctx.getContextUsage();
					const percent = usage?.percent ?? null;
					this.alertState = evaluateContextAlertState(
						percent,
						this.alertState,
						this.config.criticalThreshold,
						this.config.resetThreshold,
					);

					const label = cleanStatusLabel(rawStatus);
					const labelWidth = visibleWidth(label);
					const cometWidth = comet ? this.config.cometTrackWidth + 1 : 0;
					const separatorWidth = 7; // "   │   "
					const availableForContext = width - labelWidth - cometWidth - separatorWidth - 15;
					const tier: ContextMirrorTier =
						availableForContext >= 25 ? "full" : availableForContext >= 15 ? "short" : "percentOnly";

					if (availableForContext >= 6) {
						contextStr = renderPromptContextMirror({
							percent,
							alert: this.alertState,
							tick,
							tier,
							color: true,
							criticalThreshold: this.config.criticalThreshold,
							resetThreshold: this.config.resetThreshold,
							bold: (text) => (this.ctx?.ui?.theme as any)?.bold?.(text) ?? text,
						});
					}
				}

				const label = cleanStatusLabel(rawStatus);
				const leftParts: string[] = [];
				if (comet) leftParts.push(comet);
				leftParts.push(renderSyncFlower(tick, this.config.flowerIcon, this.config.colors.flowerColor));
				leftParts.push(scanWorkingText(label, tick));

				const [sr, sg, sb] = this.config.colors.separatorColor;
				const SEPARATOR = `   \x1b[38;2;${sr};${sg};${sb}m│\x1b[0m   `;
				if (contextStr) {
					status = `${leftParts.join(" ")}${SEPARATOR}${contextStr}`;
				} else {
					status = leftParts.join(" ");
				}
			}
		}

		let statusWidth = visibleWidth(status);
		if (statusWidth === 0) {
			// Hybrid Idle badge: User Icon + Username + Flower + Dynamic Ctx
			let ctxBadge = "";
			if (this.config.showContextInIdle && this.ctx) {
				const usage = this.ctx.getContextUsage();
				const percent = usage?.percent ?? null;
				if (percent !== null) {
					const styledPct = formatIdleContextBadge(percent, this.config.criticalThreshold);
					const [br, bg, bb] = this.config.colors.borderColor;
					const iconPrefix = this.config.userIcon ? `${this.config.userIcon} ` : "";
					ctxBadge = `  \x1b[38;2;${br};${bg};${bb}m${iconPrefix}Ctx:\x1b[0m ${styledPct}`;
				}
			}

			const [br, bg, bb] = this.config.colors.borderColor;
			const [ur, ug, ub] = this.config.colors.userNameColor;
			const iconStr = this.config.userIcon ? `\x1b[38;2;${br};${bg};${bb}m${this.config.userIcon}\x1b[0m ` : "";
			const userStr = `\x1b[1;38;2;${ur};${ug};${ub}m${this.config.username}\x1b[0m`;
			const flowerStr = `\x1b[38;2;${br};${bg};${bb}m${this.config.flowerIcon}\x1b[0m`;

			let userBadge = ` ${iconStr}${userStr} ${flowerStr}${ctxBadge} `;
			let badgeWidth = visibleWidth(userBadge);

			// Elastic degeneration if terminal is too narrow
			if (width < badgeWidth + 4 && ctxBadge) {
				userBadge = ` ${iconStr}${userStr} ${flowerStr} `;
				badgeWidth = visibleWidth(userBadge);
			}
			const overflowLabel = hiddenLineCount > 0 ? ` ↑ ${hiddenLineCount} more ` : undefined;
			const overflowLabelWidth = overflowLabel ? visibleWidth(overflowLabel) : 0;

			if (width >= badgeWidth + overflowLabelWidth + 6 && overflowLabel) {
				const rest = width - badgeWidth - overflowLabelWidth - 2;
				return (
					this.borderColor("─") +
					userBadge +
					this.borderColor("─".repeat(Math.max(1, rest))) +
					this.borderColor(overflowLabel) +
					this.borderColor("──")
				);
			}

			if (width >= badgeWidth + 4) {
				return (
					this.borderColor("─") +
					userBadge +
					this.borderColor("─".repeat(Math.max(0, width - badgeWidth - 1)))
				);
			}

			return this.borderColor("─".repeat(width));
		}

		const overflowLabel = hiddenLineCount > 0 ? ` ↑ ${hiddenLineCount} more ` : undefined;
		const overflowLabelWidth = overflowLabel ? visibleWidth(overflowLabel) : 0;
		const overflowStart = Math.floor((width - overflowLabelWidth) / 2);
		const canFitOverflow = () =>
			overflowLabel !== undefined && overflowLabelWidth + 2 <= width && overflowStart - (3 + statusWidth + 1) >= 1;

		if (overflowLabel && !canFitOverflow()) {
			status = wsi.renderSpinnerInBorder?.(width) ?? "";
			statusWidth = visibleWidth(status);
		}

		if (canFitOverflow()) {
			const leftBlockWidth = 3 + statusWidth + 1;
			return (
				this.borderColor("── ") +
				status +
				this.borderColor(
					` ${"─".repeat(overflowStart - leftBlockWidth)}${overflowLabel}${"─".repeat(width - overflowStart - overflowLabelWidth)}`,
				)
			);
		}

		if (width >= statusWidth + 5) {
			return this.borderColor("── ") + status + this.borderColor(` ${"─".repeat(width - statusWidth - 4)}`);
		}

		status = wsi.renderSpinnerInBorder?.(width) ?? "";
		statusWidth = visibleWidth(status);
		const prefixWidth = Math.min(3, Math.max(0, width - statusWidth));
		return (
			this.borderColor("─".repeat(prefixWidth)) +
			status +
			this.borderColor("─".repeat(Math.max(0, width - prefixWidth - statusWidth)))
		);
	}

	override render(width: number): string[] {
		if (width <= 0) return [];
		if (width <= 2) return super.render(width);

		const innerWidth = Math.max(1, width - 2);
		const lines = super.render(innerWidth);
		if (lines.length < 2) return lines;

		const border = this.borderColor;

		return lines.map((line, index) => {
			if (index === 0) return boxedLine(line, innerWidth, "╭", "╮", border);
			if (index === lines.length - 1) return boxedLine(line, innerWidth, "╰", "╯", border);

			return boxedLine(line, innerWidth, "│", "│", border);
		});
	}
}
