import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import type { TKhatm, RangeType, TKhatmPart } from '@prisma/client'
import type { PickAyahResult } from '$api/khatmPart/pickNext/+server'
import { PickedKhatmPart } from './PickedKhatmPart'
import type { QuranRange } from './Range'
import { untrack } from 'svelte'
import { browser } from '$app/environment'
import { KhatmPart } from './KhatmPart'

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
		return this.plain.currentAyahIndex / COUNT_OF_AYAHS
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

	get currentAyahIndex() {
		return this.plain.currentAyahIndex
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

	getLink(layout: 'wizard' | 'grid' | 'list' = 'wizard') {
		const origin = browser ? location.origin : 'https://khatm.esangar.ir'
		const prefix = this.isAyahOriented ? 'a' : 'k'
		const layoutPart = layout === 'wizard' ? '' : `/${layout}`
		return `${origin}/${prefix}${this.id}${layoutPart}${this.accessToken ? `?t=${this.accessToken}` : ''}`
	}

	get link() {
		return this.getLink()
	}

	getKhatmParts() {
		return KhatmPart.fromList(this.plainParts)
	}

	async pickNextAyat(count = 1) {
		const response = await fetch('/api/khatmPart/pickNext', {
			method: 'POST',
			body: JSON.stringify({
				khatmId: this.id,
				count,
				accessToken: this.accessToken,
			}),
		})

		const result: PickAyahResult = await response.json()

		if (!response.ok) {
			throw result
		}

		return result
	}

	share() {
		return navigator.share({
			url: this.link,
			title: `سامانه ختم قرآن گروهی | ${this.title}`,
			text: this.description,
		})
	}

	async refresh() {
		const response = await fetch(
			`/api/khatm?khatmId=${this.id}&accessToken=${this.accessToken || ''}`,
		)
		if (response.status !== 200) throw new Error('خطا')
		const result: { khatm: TKhatm & { parts?: TKhatmPart[] } } = await response.json()
		this.plain = result.khatm
		this.plainParts = result.khatm.parts || []
	}

	async pickRange(range: QuranRange) {
		const response = await fetch(`/k${this.id}`, {
			method: 'POST',
			body: JSON.stringify({
				start: range.start,
				end: range.end,
				accessToken: this.accessToken,
			}),
		})
		if (response.status !== 200) throw new Error('خطا')
		await response.json()

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
