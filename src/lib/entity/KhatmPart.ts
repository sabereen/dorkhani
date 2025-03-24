import type { KhatmPart as PlainKhatmPart } from '@prisma/client'

export class KhatmPart {
	plain: PlainKhatmPart

	constructor(plain: PlainKhatmPart) {
		this.plain = plain
	}

	static fromList(plainParts: PlainKhatmPart[]) {
		const parts = plainParts.map((part) => new KhatmPart(part)).sort((a, b) => a.start - b.start)

		if (parts.length <= 1) return parts

		// merge ranges
		const mergedRanges: KhatmPart[] = []
		let currentPart = parts[parts.length - 1]
		for (let i = parts.length - 2; i >= 0; i--) {
			if (
				currentPart.start === parts[i].end &&
				currentPart.plain.status === parts[i].plain.status
			) {
				currentPart = currentPart.clone()
				currentPart.plain.start = parts[i].start
				currentPart.plain.khatmId = NaN
			} else {
				mergedRanges.push(currentPart)
				currentPart = parts[i]
			}
		}

		mergedRanges.push(currentPart)
		return mergedRanges.reverse()
	}

	clone() {
		return new KhatmPart({ ...this.plain })
	}

	get start() {
		return this.plain.start
	}

	get end() {
		return this.plain.end
	}

	get length() {
		return this.end - this.start
	}
}
