export function roundPercent(value: number, complete = value >= 100) {
	if (complete) return 100
	if (!Number.isFinite(value) || value <= 0) return 0

	const rounded = Math.round(value * 100) / 100
	return Math.min(99.99, Math.max(0.01, rounded))
}
