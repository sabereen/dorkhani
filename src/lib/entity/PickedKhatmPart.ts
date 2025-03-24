import type { PickedKhatmPart as IDB_PickedKhatmPart } from '$lib/idb/idb'
import { idb_pickedKhatmPart_add, idb_pickedKhatmPart_getList } from '$lib/idb/pickedKhatmPart'
import { QuranRange } from './Range'

export class PickedKhatmPart {
	plain: IDB_PickedKhatmPart
	private _range?: QuranRange

	static fromPlainList(list: IDB_PickedKhatmPart[]) {
		return list.map((p) => new PickedKhatmPart(p))
	}

	static async getList(limit?: number) {
		const list = await idb_pickedKhatmPart_getList(limit)
		return this.fromPlainList(list)
	}

	constructor(plain: IDB_PickedKhatmPart) {
		this.plain = plain
	}

	get range() {
		if (!this._range) {
			this._range = new QuranRange(this.plain.start, this.plain.end)
		}
		return this._range
	}

	get khatm() {
		return this.plain.khatm
	}

	get date() {
		return this.plain.date
	}

	save() {
		return idb_pickedKhatmPart_add(this.plain)
	}
}
