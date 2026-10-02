export const GAUGE_CELLS = 8;
export const GAUGE_FILLED = "▰";
export const GAUGE_EMPTY = "▱";

export function renderGauge(
	filled: number,
	total = GAUGE_CELLS,
	fillChar = GAUGE_FILLED,
	emptyChar = GAUGE_EMPTY,
): string {
	const clamped = Math.max(0, Math.min(total, Math.round(filled)));
	return fillChar.repeat(clamped) + emptyChar.repeat(total - clamped);
}
