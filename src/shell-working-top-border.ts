import { visibleWidth } from "@earendil-works/pi-tui";
import { cleanStatusLabel } from "./ScannerWorkingEditor.js";
import { isWorkingCometEnabled, renderWorkingComet, workingCometCycleLength } from "./shell-working-comet.js";
import { renderPromptContextMirror, type ContextMirrorTier } from "./shell-prompt-context-mirror.js";
import { renderSyncFlower, scanWorkingText } from "./ScannerWorkingEditor.js";
import type { ScannerChatConfig } from "./config.js";
import { DEFAULT_CONFIG } from "./config.js";
import type { SpectrumConfig } from "./shell-prompt-context-mirror.js";

export interface WorkingIndicator {
	renderInBorder?: (width: number) => string;
	renderSpinnerInBorder?: (width: number) => string;
	currentFrame?: number;
}

export interface WorkingTopBorderOptions {
	width: number;
	hiddenLineCount: number;
	config: ScannerChatConfig;
	embedWorkingStatus: boolean;
	workingIndicator: WorkingIndicator | null;
	statusLabel?: string;
	isWaiting?: boolean;
	ctx: { getContextUsage: () => { percent: number | null } | undefined } | undefined;
	alertState: boolean;
	borderColor: (text: string) => string;
	workingStartTime?: number | null;
	currentTimestamp?: number;
	compactionCount?: number;
	username?: string;
}

export interface WorkingTiming {
	cometTick: number;
	textTick: number;
	renderIntervalMs: number;
}

const MIN_EFFECT_SPEED_MS = 10;
const MIN_RENDER_INTERVAL_MS = 25;

function effectSpeedMs(configured: number | undefined, fallback: number): number {
	return Math.max(MIN_EFFECT_SPEED_MS, configured || fallback || MIN_EFFECT_SPEED_MS);
}

/**
 * Single source of truth for working-state animation timing.
 * The comet/flower cycle and the text scan advance at their own configured speeds,
 * while `renderIntervalMs` guarantees the redraw cadence still samples the fastest one.
 */
export function deriveWorkingTiming(elapsedMs: number, config: ScannerChatConfig, frozen = false): WorkingTiming {
	const cometSpeed = effectSpeedMs(config.cometSpeedMs, DEFAULT_CONFIG.cometSpeedMs);
	const textSpeed = effectSpeedMs(config.textScanSpeedMs, DEFAULT_CONFIG.textScanSpeedMs);
	const renderIntervalMs = Math.max(MIN_RENDER_INTERVAL_MS, Math.min(cometSpeed, textSpeed));
	if (frozen) return { cometTick: 0, textTick: 0, renderIntervalMs };
	const safeElapsed = Math.max(0, elapsedMs);
	return {
		cometTick: Math.floor(safeElapsed / cometSpeed),
		textTick: Math.floor(safeElapsed / textSpeed),
		renderIntervalMs,
	};
}

export function formatDurationBadge(elapsedMs: number): string {
	if (elapsedMs < 1000) {
		return `[${(elapsedMs / 1000).toFixed(1)}s]`;
	}
	const totalSec = Math.floor(elapsedMs / 1000);
	if (totalSec < 60) {
		const dec = Math.floor((elapsedMs % 1000) / 100);
		return `[${totalSec}.${dec}s]`;
	}
	const mins = Math.floor(totalSec / 60);
	const sec = totalSec % 60;
	return `[${mins}m${sec < 10 ? "0" : ""}${sec}s]`;
}

export function renderWorkingTopBorder(options: WorkingTopBorderOptions): string {
	const {
		width,
		hiddenLineCount,
		config,
		embedWorkingStatus,
		workingIndicator,
		ctx,
		alertState,
		borderColor,
		workingStartTime,
		currentTimestamp = Date.now(),
	} = options;

	if (width <= 0) return "";

	const wsi = workingIndicator;
	const cycleLength = workingCometCycleLength(config.cometTrackWidth, config.cometGlyphs.length);
	const elapsedMs = (workingStartTime && workingStartTime > 0)
		? Math.max(0, currentTimestamp - workingStartTime)
		: 0;
	const timing = deriveWorkingTiming(elapsedMs, config, Boolean(config.zenMode || options.isWaiting));
	let status = "";

	const rawStatus =
		(embedWorkingStatus && wsi?.renderInBorder?.(Math.max(1, width - 8))) ||
		(embedWorkingStatus && options.statusLabel) ||
		"";

	if (embedWorkingStatus && rawStatus) {
		const tick = timing.cometTick;

		if (rawStatus) {
			const comet = (!config.zenMode && !options.isWaiting && config.enableComet && isWorkingCometEnabled())
				? renderWorkingComet({
					tick,
					width: config.cometTrackWidth,
					color: true,
					config: {
						glyphs: config.cometGlyphs,
						colors: config.cometColors,
					},
				})
				: "";

			let contextStr = "";
			if (config.showWorkingContext !== false && ctx) {
				const usage = ctx.getContextUsage();
				const percent = usage?.percent ?? null;
				const newAlertState = evaluateAlertState(
					percent,
					alertState,
					config.criticalThreshold,
					config.resetThreshold,
				);

				const label = cleanStatusLabel(rawStatus);
				const labelWidth = visibleWidth(label);
				const cometWidth = comet ? config.cometTrackWidth + 2 : 0;
				const durationEstWidth = config.showWorkingDuration ? 9 : 0;
				const compactionEstWidth = (config.showCompactionCount && options.compactionCount && options.compactionCount > 0) ? 6 : 0;
				const baseOccupied = 4 + cometWidth + 2 + labelWidth + durationEstWidth + compactionEstWidth + 10;
				const availableForContext = width - baseOccupied;
				const tier: ContextMirrorTier =
					availableForContext >= 25 ? "full" : availableForContext >= 15 ? "short" : "percentOnly";

				if (availableForContext >= 6) {
					const spectrumConfig: Partial<SpectrumConfig> = {
						cellColors: config.spectrumColors,
						emptyCellColor: config.colors.emptyCellColor,
						labelColor: config.colors.labelColor,
						neonRedPulseBase: config.colors.neonRedPulseBase,
						neonRedPulsePeak: config.colors.neonRedPulsePeak,
						warningThreshold: config.warningThreshold,
						criticalThreshold: config.criticalThreshold,
						resetThreshold: config.resetThreshold,
					};
					contextStr = renderPromptContextMirror({
						percent,
						alert: newAlertState,
						tick,
						tier,
						color: true,
						criticalThreshold: config.criticalThreshold,
						resetThreshold: config.resetThreshold,
						bold: (text) => `\x1b[1m${text}\x1b[0m`,
						config: spectrumConfig,
					});
				}
			}

			// If Zen mode, static flower; else animated flower
			const flower = config.zenMode
				? `\x1b[38;2;${config.colors.flowerColor[0]};${config.colors.flowerColor[1]};${config.colors.flowerColor[2]}m${config.flowerIcon}\x1b[0m`
				: renderSyncFlower(tick, config.flowerIcon, config.colors.flowerColor, cycleLength);

			// Text scan effect or static text in Zen mode
			const label = cleanStatusLabel(rawStatus);
			const scannedText = config.zenMode ? label : scanWorkingText(label, timing.textTick);

			const [sr, sg, sb] = config.colors.separatorColor;
			const SEPARATOR = ` \x1b[38;2;${sr};${sg};${sb}m│\x1b[0m `;

			// 0. User identity badge (󰣇 Wilox ✿) if enabled
			const resolvedUsername = options.username || config.username;
			let userBadge = "";
			if (config.showWorkingIdentity && resolvedUsername) {
				const [br, bg, bb] = config.colors.borderColor;
				const [ur, ug, ub] = config.colors.userNameColor;
				const iconStr = config.userIcon ? `\x1b[38;2;${br};${bg};${bb}m${config.userIcon}\x1b[0m ` : "";
				const userStr = `\x1b[1;38;2;${ur};${ug};${ub}m${resolvedUsername}\x1b[0m`;
				const flowerStr = `\x1b[38;2;${br};${bg};${bb}m${config.flowerIcon}\x1b[0m`;
				userBadge = `${iconStr}${userStr} ${flowerStr}`;
			}

			// 1. Comet + space + Flower + space + action text
			const actionSection = `${comet ? `${comet}  ` : ""}${flower} ${scannedText}`;
			const mainChainParts: string[] = [];

			if (userBadge) {
				mainChainParts.push(userBadge);
			}
			mainChainParts.push(actionSection);

			// 2. Duration badge: [X.Xs]
			if (config.showWorkingDuration && workingStartTime && workingStartTime > 0) {
				const durationLabel = formatDurationBadge(elapsedMs);
				const [lr, lg, lb] = config.colors.labelColor;
				mainChainParts.push(`\x1b[38;2;${lr};${lg};${lb}m${durationLabel}\x1b[0m`);
			}

			// 3. Compaction badge: 󰁨×n (only if > 0)
			if (config.showCompactionCount && options.compactionCount && options.compactionCount > 0) {
				const [lr, lg, lb] = config.colors.labelColor;
				mainChainParts.push(`\x1b[38;2;${lr};${lg};${lb}m${config.compactionIcon}×${options.compactionCount}\x1b[0m`);
			}

			// 4. Context mirror immediately follows in sequence
			if (contextStr) {
				mainChainParts.push(contextStr);
			}

			status = mainChainParts.join(SEPARATOR);
		}
	}

	let statusWidth = visibleWidth(status);
	if (statusWidth === 0) {
		return borderColor("─".repeat(width));
	}

	const overflowLabel = hiddenLineCount > 0 ? ` ↑ ${hiddenLineCount} more ` : undefined;
	const overflowLabelWidth = overflowLabel ? visibleWidth(overflowLabel) : 0;
	const overflowStart = Math.floor((width - overflowLabelWidth) / 2);
	const canFitOverflow = () =>
		overflowLabel !== undefined && overflowLabelWidth + 2 <= width && overflowStart - (3 + statusWidth + 1) >= 1;

	let currentStatus = status;
	let currentStatusWidth = statusWidth;

	const fallbackSpinner = () =>
		config.zenMode || options.isWaiting
			? `\x1b[38;2;${config.colors.flowerColor[0]};${config.colors.flowerColor[1]};${config.colors.flowerColor[2]}m${config.flowerIcon}\x1b[0m`
			: renderSyncFlower(timing.cometTick, config.flowerIcon, config.colors.flowerColor, cycleLength);

	if (overflowLabel && !canFitOverflow()) {
		currentStatus = wsi?.renderSpinnerInBorder?.(width) ?? fallbackSpinner();
		currentStatusWidth = visibleWidth(currentStatus);
	}

	if (canFitOverflow()) {
		const leftBlockWidth = 3 + currentStatusWidth + 1;
		return (
			borderColor("── ") +
			currentStatus +
			borderColor(
				` ${"─".repeat(overflowStart - leftBlockWidth)}${overflowLabel}${"─".repeat(width - overflowStart - overflowLabelWidth)}`,
			)
		);
	}

	if (width >= currentStatusWidth + 5) {
		return borderColor("── ") + currentStatus + borderColor(` ${"─".repeat(width - currentStatusWidth - 4)}`);
	}

	currentStatus = wsi?.renderSpinnerInBorder?.(width) ?? fallbackSpinner();
	currentStatusWidth = visibleWidth(currentStatus);
	const prefixWidth = Math.min(3, Math.max(0, width - currentStatusWidth));
	return (
		borderColor("─".repeat(prefixWidth)) +
		currentStatus +
		borderColor("─".repeat(Math.max(0, width - prefixWidth - currentStatusWidth)))
	);
}

function evaluateAlertState(
	currentPercent: number | null,
	previousAlertState: boolean,
	criticalThreshold: number,
	resetThreshold: number,
): boolean {
	if (currentPercent === null) return false;
	if (previousAlertState) {
		return currentPercent > resetThreshold;
	}
	return currentPercent >= criticalThreshold;
}
