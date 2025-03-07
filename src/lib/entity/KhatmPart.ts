import type { KhatmPart as PlainKhatmPart } from '@prisma/client'
import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'

export class KhatmPart {
	plain: PlainKhatmPart

	constructor(plain: PlainKhatmPart) {
		this.plain = plain
	}

	get start() {
		return this.plain.start
	}

	get end() {
		return this.plain.end
	}

	get length() {
		return this.end - this.start + 1
	}

	getStyle(minIndex = 0, maxIndex = COUNT_OF_AYAHS - 1) {
		const start = Math.max(this.start, minIndex)
		const end = Math.min(this.end, maxIndex)
		const maxLength = maxIndex - minIndex

		return {
			start: (100 * (start - minIndex)) / maxLength + '%',
			width: (100 * (end - start)) / maxLength + '%',
		}
	}
}
