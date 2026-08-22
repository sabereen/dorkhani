import type { ZekrRecord } from '$lib/contracts/domain'
import { untrack } from 'svelte'
import copy from 'clipboard-copy'
import { rebaseFullPath } from '$lib/utility/path'
import { browser } from '$app/environment'
import { request } from '$lib/utility/request'
import { idb_localZekr_increaseMyCount } from '$lib/idb/localZekr'
import * as m from '$lib/paraglide/messages.js'
import { publicWebUrl } from '$lib/config/runtime'

const cache = new Map<number, Zekr>()

export class Zekr {
	plain = $state() as ZekrRecord

	private constructor(plain: ZekrRecord) {
		this.plain = plain
	}

	static fromPlain(plain: ZekrRecord) {
		if (!browser) return new this(plain)

		let zekr = cache.get(plain.id)
		if (zekr) {
			untrack(() => {
				const isNewer = plain.count > zekr!.count
				if (isNewer) {
					zekr!.plain = plain
				}
			})
		} else {
			untrack(() => {
				zekr = new this(plain)
				cache.set(plain.id, zekr)
			})
		}
		return zekr!
	}

	static fromPlainList(plainList: ZekrRecord[]) {
		return plainList.map((plain) => this.fromPlain(plain))
	}

	get id() {
		return this.plain.id
	}

	get title() {
		return this.plain.title
	}

	get description() {
		return this.plain.description
	}

	get zekrText() {
		return this.plain.zekrText
	}

	get count() {
		return this.plain.count
	}

	get targetCount() {
		return this.plain.targetCount || Infinity
	}

	get isFinite() {
		return this.targetCount !== Infinity
	}

	get progress() {
		return Math.min(this.count / this.targetCount, 1)
	}

	get percent() {
		return Math.floor(100_00 * this.progress) / 100
	}

	get finished() {
		return this.progress >= 1
	}

	getLink() {
		return rebaseFullPath(`z${this.id}`)
	}

	get link() {
		return this.getLink()
	}

	get publicLink() {
		const localUrl = new URL(this.link)
		return publicWebUrl(`${localUrl.pathname}${localUrl.search}`, localUrl.origin)
	}

	async pick({ count = 1 }: { count: number }) {
		await request('post', '/zekr/pick', {
			zekrId: this.id,
			count,
		})
		this.plain.count += count
		idb_localZekr_increaseMyCount(this.plain, count)
	}

	async share() {
		try {
			await navigator.share({
				url: this.publicLink,
				text: m.share_zekr({ title: this.title, description: this.description }),
			})
		} catch (err) {
			console.error(err)
			await copy(this.publicLink)
		}
	}

	async copy() {
		try {
			await navigator.clipboard.writeText(this.publicLink)
		} catch (err) {
			console.error(err)
			await copy(this.publicLink)
		}
	}

	// async refresh() {
	// 	const result = await request<{ khatm: TKhatm & { parts?: TKhatmPart[] } }>('get', '/khatm', {
	// 		khatmId: this.id,
	// 		accessToken: this.accessToken || '',
	// 	})
	// 	this.plain = result.khatm
	// 	this.plainParts = result.khatm.parts || []
	// }
}
