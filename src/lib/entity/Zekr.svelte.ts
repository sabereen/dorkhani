import type { TZekr } from '@prisma/client'
import { untrack } from 'svelte'
import copy from 'clipboard-copy'
import { rebaseFullPath } from '$lib/utility/path'
import { browser } from '$app/environment'

const cache = new Map<number, Zekr>()

export class Zekr {
	plain = $state() as TZekr

	private constructor(plain: TZekr) {
		this.plain = plain
	}

	static fromPlain(plain: TZekr) {
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

	static fromPlainList(plainList: TZekr[]) {
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

	get count() {
		return this.plain.count
	}

	get targetCount() {
		return this.plain.targetCount || Infinity
	}

	get progress() {
		return this.count / this.targetCount
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

	// async pickNextAyat({ count = 1, translation }: { count: number; translation: Translation }) {
	// 	const result = await request<PickAyahResult>('post', '/khatmPart/pickNext', {
	// 		khatmId: this.id,
	// 		count,
	// 		accessToken: this.accessToken,
	// 		translation,
	// 	})

	// 	return result
	// }

	async share() {
		try {
			await navigator.share({
				url: this.link,
				text: `سامانه ختم ذکر گروهی | ${this.title}\n` + this.description + '\n',
			})
		} catch (err) {
			console.error(err)
			await copy(this.link)
		}
	}

	async copy() {
		try {
			await navigator.clipboard.writeText(this.link)
		} catch (err) {
			console.error(err)
			await copy(this.link)
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
