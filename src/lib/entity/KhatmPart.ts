import type { KhatmPart as PlainKhatmPart } from '@prisma/client'

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
}
