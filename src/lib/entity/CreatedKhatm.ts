import { clientStorage, type CreatedKhatmRecord } from '$lib/storage/client'
import { Khatm } from './Khatm.svelte'

export class CreatedKhatm {
	plain: CreatedKhatmRecord
	private _khatm?: Khatm

	constructor(plain: CreatedKhatmRecord) {
		this.plain = plain
	}

	static fromPlainList(list: CreatedKhatmRecord[]) {
		return list.map((p) => new CreatedKhatm(p))
	}

	static async getList(limit?: number) {
		const list = await clientStorage.createdKhatms.getList(limit)
		return this.fromPlainList(list)
	}

	get id() {
		return this.plain.khatm.id
	}

	get khatm() {
		if (!this._khatm) {
			this._khatm = Khatm.fromPlain(this.plain.khatm)
		}
		return this._khatm
	}

	save() {
		return clientStorage.createdKhatms.add(this.plain)
	}
}
