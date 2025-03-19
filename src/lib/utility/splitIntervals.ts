interface Interval {
	start: number
	end: number
}

interface AtomicInterval extends Interval {
	from: number | null // فیلد from می‌تواند یک عدد (ایندکس) یا null باشد
}

export function splitInterval(mainInterval: Interval, intervals: Interval[]): AtomicInterval[] {
	// جمع‌آوری نقاط شروع و پایان
	const points = new Set<number>()
	for (const interval of intervals) {
		points.add(interval.start)
		points.add(interval.end)
	}

	// اضافه کردن نقاط شروع و پایان بازه اصلی
	points.add(mainInterval.start)
	points.add(mainInterval.end)

	// تبدیل به آرایه و مرتب‌سازی
	const sortedPoints = Array.from(points).sort((a, b) => a - b)

	// ایجاد زیربازه‌های اتمیک
	const atomicIntervals: AtomicInterval[] = []
	for (let i = 0; i < sortedPoints.length - 1; i++) {
		const start = sortedPoints[i]
		const end = sortedPoints[i + 1]

		// بررسی آیا زیربازه در محدوده بازه اصلی قرار دارد
		if (start >= mainInterval.start && end <= mainInterval.end) {
			// پیدا کردن بازه ورودی که با این زیربازه همپوشانی دارد
			let from: number | null = null
			for (let j = 0; j < intervals.length; j++) {
				if (start < intervals[j].end && end > intervals[j].start) {
					from = j // فقط یک بازه ورودی می‌تواند با زیربازه اتمیک همپوشانی داشته باشد
					break // چون اتمیک است، نیازی به بررسی بقیه بازه‌ها نیست
				}
			}

			// اضافه کردن زیربازه اتمیک به خروجی
			atomicIntervals.push({ start, end, from })
		}
	}

	return atomicIntervals
}
