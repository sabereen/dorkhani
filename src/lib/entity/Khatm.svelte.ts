import { page } from '$app/state'
import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import type { Khatm as KhatmPlain, RangeType } from '@prisma/client'
import type { PickAyahResult } from '../../routes/api/khatm/pickNext/+server'
import { PickedKhatmPart } from './PickedKhatmPart'
import type { QuranRange } from './Range'
import { untrack } from 'svelte'

const cache = new Map<number, Khatm>()

export class Khatm {
	plain = $state() as KhatmPlain

	private constructor(plain: KhatmPlain) {
		this.plain = plain
	}

	static fromPlain(plain: KhatmPlain) {
		let khatm = cache.get(plain.id)
		if (khatm) {
			untrack(() => {
				khatm!.plain = plain
			})
		} else {
			untrack(() => {
				khatm = new this(plain)
				cache.set(plain.id, khatm)
			})
		}
		return khatm!
	}

	static fromPlainList(plainList: KhatmPlain[]) {
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
		return this.plain.sequential
	}

	get currentAyahIndex() {
		return this.plain.currentAyahIndex
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

	getLink(hash?: string | null) {
		return `https://khatm.esangar.ir/khatm/${this.id}${hash ? `?token=${hash}` : ''}`
	}

	async pickNextAyat(count = 1) {
		const response = await fetch('/api/khatm/pickNext', {
			method: 'POST',
			body: JSON.stringify({
				khatmId: this.id,
				count,
				token: page.url.searchParams.get('token'),
			}),
		})

		const result: PickAyahResult = await response.json()

		if (!response.ok) {
			throw result
		}

		return result
	}

	async pickRange(range: QuranRange) {
		const response = await fetch(`/khatm/${this.id}`, {
			method: 'POST',
			body: JSON.stringify({
				start: range.start,
				end: range.end,
				token: page.url.searchParams.get('token'),
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
			hash: page.url.searchParams.get('token'),
		}).save()
	}
}
