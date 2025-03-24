import { HizbQuarter } from '@ghoran/entity'
import { QuranRange } from './Range'

export function hizbQuarter_toRange(hizbQuarter: HizbQuarter) {
	return new QuranRange(
		hizbQuarter.firstAyahIndex,
		hizbQuarter.lastAyahIndex + 1,
		`حزب ${hizbQuarter.hizbNumber} (ربع${hizbQuarter.number})`,
	)
}
