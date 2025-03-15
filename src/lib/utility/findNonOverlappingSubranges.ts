type Range = { start: number; end: number }

export function findNonOverlappingSubranges(ranges: Range[], targetRanges: Range[]): Range[] {
	ranges.sort((a, b) => a.start - b.start)

	const nonOverlappingSubranges: Range[] = []

	for (const targetRange of targetRanges) {
		let currentStart = targetRange.start

		for (const range of ranges) {
			// اگر بازه جاری قبل از currentStart باشد، آن را نادیده می‌گیریم (با توجه به [start, end))
			if (range.end <= currentStart) continue

			// اگر بازه جاری بعد از targetRange.end باشد، کار تمام است (با توجه به [start, end))
			if (range.start >= targetRange.end) break

			// اگر بین currentStart و start بازه جاری فاصله‌ای وجود داشته باشد (با توجه به [start, end))
			if (range.start > currentStart) {
				nonOverlappingSubranges.push({ start: currentStart, end: range.start })
			}

			// currentStart را به انتهای بازه جاری منتقل می‌کنیم (با توجه به [start, end))
			currentStart = Math.max(currentStart, range.end)
		}

		// اگر بعد از آخرین بازه هم فاصله‌ای تا انتهای targetRange باقی مانده باشد (با توجه به [start, end))
		if (currentStart < targetRange.end) {
			nonOverlappingSubranges.push({ start: currentStart, end: targetRange.end })
		}
	}

	return nonOverlappingSubranges
}
