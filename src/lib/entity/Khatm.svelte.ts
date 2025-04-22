import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import type { TKhatm, RangeType, TKhatmPart } from '@prisma/client'
import type { PickAyahResult } from '$api/khatmPart/pickNext/+server'
import { PickedKhatmPart } from './PickedKhatmPart'
import type { QuranRange } from './Range'
import { untrack } from 'svelte'
import { KhatmPart } from './KhatmPart'
import { request } from '$lib/utility/request'
import copy from 'clipboard-copy'
import { rebaseFullPath } from '$lib/utility/path'

const cache = new Map<number, Khatm>()

export class Khatm {
	plain = $state() as TKhatm
	plainParts = $state([]) as TKhatmPart[]

	private constructor(plain: TKhatm & { parts?: TKhatmPart[] }) {
		this.plain = plain
		this.plainParts = plain.parts || []
	}

	static fromPlain(plain: TKhatm & { parts?: TKhatmPart[] }) {
		let khatm = cache.get(plain.id)
		if (khatm) {
			untrack(() => {
				khatm!.plain = plain
				if (plain.parts) {
					khatm!.plainParts = plain.parts
				}
			})
		} else {
			untrack(() => {
				khatm = new this(plain)
				cache.set(plain.id, khatm)
			})
		}
		return khatm!
	}

	static fromPlainList(plainList: TKhatm[]) {
		return plainList.map((plain) => this.fromPlain(plain))
	}

	static getRangeTypeTitle(rangeType: RangeType) {
		return {
			ayah: 'آیه به آیه',
			surah: 'سوره به سوره',
			juz: 'جزء به جزء',
			hizbQuarter: 'حزب به حزب',
			page: 'صفحه به صفحه',
			free: 'آزاد',
		}[rangeType]
	}

	static getOneItemFromRangeTitle(rangeType: RangeType) {
		return {
			ayah: 'یک آیه',
			surah: 'یک سوره',
			juz: 'یک جزء',
			hizbQuarter: 'یک چهارم حزب',
			page: 'یک صفحه',
			free: 'یک بازه‌ی آزاد',
		}[rangeType]
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

	get progress() {
		return this.plain.versesRead / COUNT_OF_AYAHS
	}

	get percent() {
		return Math.floor(100_00 * this.progress) / 100
	}

	get rangeType() {
		return this.plain.rangeType
	}

	get private() {
		return this.plain.private
	}

	get sequential() {
		return this.isAyahOriented
	}

	get versesRead() {
		return this.plain.versesRead
	}

	get accessToken() {
		return this.plain.accessToken || null
	}

	get isAyahOriented() {
		return this.rangeType === 'ayah'
	}

	get isFree() {
		return this.rangeType === 'free'
	}

	get rangeTypeTitle() {
		return Khatm.getRangeTypeTitle(this.rangeType)
	}

	get finished() {
		return this.progress >= 1
	}

	getLink(layout: 'wizard' | 'grid' | 'list' = 'wizard') {
		const prefix = this.isAyahOriented ? 'a' : 'k'
		const layoutPart = layout === 'wizard' ? '' : `/${layout}`
		return rebaseFullPath(
			`${prefix}${this.id}${layoutPart}${this.accessToken ? `?t=${this.accessToken}` : ''}`,
		)
	}

	get link() {
		return this.getLink()
	}

	getKhatmParts() {
		return KhatmPart.fromList(this.plainParts)
	}

	async pickNextAyat(count = 1) {
		const result = await request<PickAyahResult>('post', '/khatmPart/pickNext', {
			khatmId: this.id,
			count,
			accessToken: this.accessToken,
		})

		return result
	}

	async share() {
		try {
			await navigator.share({
				url: this.link,
				title: `سامانه ختم قرآن گروهی | ${this.title}`,
				text: this.description,
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

	async refresh() {
		const result = await request<{ khatm: TKhatm & { parts?: TKhatmPart[] } }>('get', '/khatm', {
			khatmId: this.id,
			accessToken: this.accessToken || '',
		})
		this.plain = result.khatm
		this.plainParts = result.khatm.parts || []
	}

	async pickRange(range: QuranRange) {
		await request('post', '/khatmPart/pickRange', {
			start: range.start,
			end: range.end,
			khatmId: this.id,
			accessToken: this.accessToken,
		})

		new PickedKhatmPart({
			id: undefined as unknown as number,
			date: new Date(),
			start: range.start,
			end: range.end,
			khatm: this.plain,
			hash: this.accessToken,
		}).save()
	}
}
