import { clientStorage, type PickedKhatmPartRecord } from '$lib/storage/client'
import { Khatm } from './Khatm.svelte'
import { QuranRange } from './Range'

export class PickedKhatmPart {
	plain: PickedKhatmPartRecord
	private _range?: QuranRange
	private _khatm?: Khatm

	static fromPlainList(list: PickedKhatmPartRecord[]) {
		return list.map((p) => new PickedKhatmPart(p))
	}

	static async getList(limit?: number) {
		const list = await clientStorage.pickedKhatmParts.getList(limit)
		return this.fromPlainList(list)
	}

	static async getByKhatmId(khatmId: number) {
		const list = await clientStorage.pickedKhatmParts.getByKhatmId(khatmId)
		return this.fromPlainList(list)
	}

	static async getBySeriesId(seriesId: number) {
		const list = await clientStorage.pickedKhatmParts.getBySeriesId(seriesId)
		return this.fromPlainList(list)
	}

	constructor(plain: PickedKhatmPartRecord) {
		this.plain = plain
	}

	get range() {
		if (!this._range) {
			this._range = new QuranRange(this.plain.start, this.plain.end)
		}
		return this._range
	}

	get khatm() {
		if (!this._khatm) {
			this._khatm = Khatm.fromPlain(this.plain.khatm)
		}
		return this._khatm
	}

	get date() {
		return this.plain.date
	}

	save() {
		return clientStorage.pickedKhatmParts.add(this.plain)
	}
}
