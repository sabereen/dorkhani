import type { CreatedKhatm as IDB_CreatedKhatm } from '$lib/idb/idb'
import { idb_createdKhatm_add, idb_createdKhatm_getList } from '$lib/idb/createdKhatm'
import { Khatm } from './Khatm.svelte'

export class CreatedKhatm {
	plain: IDB_CreatedKhatm
	private _khatm?: Khatm

	constructor(plain: IDB_CreatedKhatm) {
		this.plain = plain
	}

	static fromPlainList(list: IDB_CreatedKhatm[]) {
		return list.map((p) => new CreatedKhatm(p))
	}

	static async getList(limit?: number) {
		const list = await idb_createdKhatm_getList(limit)
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
		return idb_createdKhatm_add(this.plain)
	}
}
