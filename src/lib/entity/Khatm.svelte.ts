import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import type { TKhatm, RangeType, TKhatmPart, ReviewStatus } from '@prisma-client'
import type { PickAyahResult } from '$api/khatmPart/pickNext/+server'
import { PickedKhatmPart } from './PickedKhatmPart'
import { QuranRange } from './Range'
import { untrack } from 'svelte'
import { KhatmPart } from './KhatmPart'
import { request } from '$lib/utility/request'
import copy from 'clipboard-copy'
import { rebaseFullPath } from '$lib/utility/path'
import { browser } from '$app/environment'
import type { Translation } from './LocalSettings.svelte'

const cache = new Map<number, Khatm>()

export class Khatm {
	plain = $state() as TKhatm
	plainParts = $state([]) as TKhatmPart[]

	private constructor(plain: TKhatm & { parts?: TKhatmPart[] }) {
		this.plain = plain
		this.plainParts = plain.parts || []
	}

	static fromPlain(plain: TKhatm & { parts?: TKhatmPart[] }) {
		if (!browser) return new this(plain)

		let khatm = cache.get(plain.id)
		if (khatm) {
			untrack(() => {
				const isNewer = plain.versesRead > khatm!.versesRead
				if (isNewer) {
					khatm!.plain = plain
				}
				if (plain.parts && khatm!.plainParts.length < plain.parts.length) {
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

	static async getList({
		pageID,
		reviewStatus = 'approved',
	}: {
		pageID?: number
		reviewStatus?: ReviewStatus
	}) {
		const { list } = await request<{ list: TKhatm[] }>('get', '/khatm/list', {
			pageID,
			reviewStatus,
		})

		return Khatm.fromPlainList(list)
	}

	/**
	 * این متد مخصوص استفاده در سمت ادمین است
	 * ختم‌ها را بررسی می‌کند و وضعیت ختم‌هایی که جا افتاده اند را اصلاح می‌کند
	 * و اگر کامل شده باشند آن‌ها را به عنوان کامل شده علامت می‌زند
	 */
	static refreshStatusList() {
		return request<void>('post', '/khatm/refreshStatus')
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

	getProgressByPage() {
		if (this.versesRead === 0) return 0
		if (this.rangeType === 'ayah') {
			return new QuranRange(0, this.versesRead).getCoveragePercent()
		}
		if (!this.plainParts) return null
		let progress = 0
		for (const part of this.plainParts) {
			progress += new QuranRange(part.start, part.end).getCoveragePercent()
		}
		return progress
	}

	get progress() {
		return this.versesRead / COUNT_OF_AYAHS
	}

	get percent() {
		return Math.floor(100_00 * this.progress) / 100
	}

	get isSerial() {
		return this.seriesId != null
	}

	get rangeType() {
		return this.plain.rangeType
	}

	get private() {
		return this.plain.private
	}

	get roundNumber() {
		return this.plain.roundNumber
	}

	get seriesId() {
		return this.plain.seriesId
	}

	get status() {
		return this.plain.status
	}

	get sequential() {
		return this.isAyahOriented
	}

	get versesRead() {
		return this.plain.versesRead
	}

	get reviewStatus() {
		return this.plain.reviewStatus
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
		return this.status === 'completed'
	}

	getRoundTitle() {
		if (!this.isSerial) return ''
		if (this.roundNumber === 1) return 'دور اوّل'
		if (this.roundNumber === 2) return 'دور دوم'
		return 'دور ' + this.roundNumber.toLocaleString('fa')
	}

	getLink(layout: 'wizard' | 'grid' | 'list' = 'wizard') {
		let prefix = this.isAyahOriented ? 'a' : 'k'
		if (this.isSerial) prefix += 's'
		const id = this.isSerial ? this.seriesId : this.id
		const layoutPart = layout === 'wizard' ? '' : `/${layout}`
		return rebaseFullPath(
			`${prefix}${id}${layoutPart}${this.accessToken ? `?t=${this.accessToken}` : ''}`,
		)
	}

	get link() {
		return this.getLink()
	}

	getKhatmParts() {
		return KhatmPart.fromList(this.plainParts)
	}

	async pickNextAyat({ count = 1, translation }: { count: number; translation: Translation }) {
		const result = await request<PickAyahResult>('post', '/khatmPart/pickNext', {
			khatmId: this.id,
			count,
			accessToken: this.accessToken,
			translation,
		})

		return result
	}

	async share() {
		try {
			await navigator.share({
				url: this.link,
				text: `سامانه ختم قرآن گروهی | ${this.title}\n` + this.description + '\n',
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

	async update({ reviewStatus }: Pick<TKhatm, 'reviewStatus'>) {
		const { khatm } = await request<{ khatm: TKhatm }>('post', '/khatm/update', {
			id: this.id,
			reviewStatus,
		})
		this.plain = khatm
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
