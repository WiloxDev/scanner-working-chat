import { visibleWidth } from "@earendil-works/pi-tui";
import { formatIdleContextBadge } from "./shell-prompt-context-mirror.js";
import type { ScannerChatConfig } from "./config.js";

export interface IdleBadgeOptions {
	width: number;
	hiddenLineCount: number;
	config: ScannerChatConfig;
	username: string;
	percent: number | null;
	borderColor: (text: string) => string;
}

export function renderIdleTopBorder(options: IdleBadgeOptions): string {
	const { width, hiddenLineCount, config, username, percent, borderColor } = options;

	if (width <= 0) return "";

	// Build context badge if enabled
	let ctxBadge = "";
	if (config.showContextInIdle && percent !== null) {
		const styledPct = formatIdleContextBadge(percent, config.criticalThreshold, {
			cellColors: config.spectrumColors,
			neonRedPulsePeak: config.colors.neonRedPulsePeak,
		});
		const [br, bg, bb] = config.colors.borderColor;
		const iconPrefix = config.userIcon ? `${config.userIcon} ` : "";
		ctxBadge = `  \x1b[38;2;${br};${bg};${bb}m${iconPrefix}Ctx:\x1b[0m ${styledPct}`;
	}

	// Build user badge: icon + username + flower
	const [br, bg, bb] = config.colors.borderColor;
	const [ur, ug, ub] = config.colors.userNameColor;
	const iconStr = config.userIcon ? `\x1b[38;2;${br};${bg};${bb}m${config.userIcon}\x1b[0m ` : "";
	const userStr = `\x1b[1;38;2;${ur};${ug};${ub}m${username}\x1b[0m`;
	const flowerStr = `\x1b[38;2;${br};${bg};${bb}m${config.flowerIcon}\x1b[0m`;

	let userBadge = ` ${iconStr}${userStr} ${flowerStr}${ctxBadge} `;
	let badgeWidth = visibleWidth(userBadge);

	// Elastic degeneration: drop ctxBadge if too narrow
	// Need at least 4 chars for border padding on each side
	if (width < badgeWidth + 4 && ctxBadge) {
		userBadge = ` ${iconStr}${userStr} ${flowerStr} `;
		badgeWidth = visibleWidth(userBadge);
	}

	const overflowLabel = hiddenLineCount > 0 ? ` ↑ ${hiddenLineCount} more ` : undefined;
	const overflowLabelWidth = overflowLabel ? visibleWidth(overflowLabel) : 0;

	// Case 1: Fits with overflow label centered
	// Total width = 1 (left ─) + badgeWidth + rest + overflowLabelWidth + 2 (right ──) = width
	// So rest = width - badgeWidth - overflowLabelWidth - 3
	if (width >= badgeWidth + overflowLabelWidth + 6 && overflowLabel) {
		const rest = width - badgeWidth - overflowLabelWidth - 3;
		return (
			borderColor("─") +
			userBadge +
			borderColor("─".repeat(Math.max(1, rest))) +
			borderColor(overflowLabel) +
			borderColor("──")
		);
	}

	// Case 2: Fits without overflow label
	// Total width = 1 (left ─) + badgeWidth + rest + 0 (no right ── needed, just fill)
	// Actually: borderColor("─") + userBadge + borderColor("─".repeat(width - badgeWidth - 1))
	// = 1 + badgeWidth + (width - badgeWidth - 1) = width ✓
	if (width >= badgeWidth + 4) {
		return (
			borderColor("─") +
			userBadge +
			borderColor("─".repeat(Math.max(0, width - badgeWidth - 1)))
		);
	}

	// Case 3: Too narrow - just border
	return borderColor("─".repeat(width));
}