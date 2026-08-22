import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import type { KhatmData, KhatmPartData, RangeType, ReviewStatus } from '$lib/contracts/domain'
import type { PickAyahResult } from '$lib/contracts/api'
import { QuranRange } from './Range'
import { untrack } from 'svelte'
import { KhatmPart } from './KhatmPart'
import { request } from '$lib/utility/request'
import copy from 'clipboard-copy'
import { rebaseFullPath } from '$lib/utility/path'
import { browser } from '$app/environment'
import type { Translation } from './LocalSettings.svelte'
import type { KhatmDirectoryQuery, KhatmDirectoryResult } from './KhatmDirectory'
import { KhatmParticipation } from './KhatmParticipation.svelte'
import { roundPercent } from '$lib/utility/percent'
import type { AdminKhatmListItem } from './KhatmFeatured'
import { formatNumber } from '$lib/i18n/format'
import * as m from '$lib/paraglide/messages.js'
import { publicWebUrl } from '$lib/config/runtime'

const cache = new Map<number, Khatm>()

export class Khatm {
	plain = $state() as KhatmData
	plainParts = $state([]) as KhatmPartData[]
	participation: KhatmParticipation

	private constructor(plain: KhatmData & { parts?: KhatmPartData[] }) {
		this.plain = Khatm.normalizePlain(plain)
		this.plainParts = plain.parts || []
		this.participation = new KhatmParticipation(() => this.plain)
	}

	private static normalizePlain(
		plain: KhatmData & { parts?: KhatmPartData[] },
	): KhatmData & { parts?: KhatmPartData[] } {
		if (Number.isFinite(plain.pageProgress) && plain.aiReviewStatus) return plain
		return {
			...plain,
			pageProgress: Number.isFinite(plain.pageProgress) ? plain.pageProgress : 0,
			aiReviewStatus: plain.aiReviewStatus || 'disabled',
			aiReviewReason: plain.aiReviewReason || null,
		}
	}

	static fromPlain(plain: KhatmData & { parts?: KhatmPartData[] }) {
		plain = this.normalizePlain(plain)
		if (!browser) return new this(plain)

		let khatm = cache.get(plain.id)
		if (khatm) {
			untrack(() => {
				const isNewer =
					plain.versesRead > khatm!.versesRead ||
					(plain.versesRead === khatm!.versesRead &&
						(plain.pageProgress > khatm!.pageProgress ||
							(plain.status === 'completed' && khatm!.status !== 'completed')))
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

	static fromPlainList(plainList: KhatmData[]) {
		return plainList.map((plain) => this.fromPlain(plain))
	}

	static async getList({
		pageID,
		reviewStatus = 'approved',
	}: {
		pageID?: number
		reviewStatus?: ReviewStatus
	}) {
		const { list } = await request<{ list: KhatmData[] }>('get', '/khatm/list', {
			pageID,
			reviewStatus,
		})

		return Khatm.fromPlainList(list)
	}

	static async getAdminList({
		pageID,
		reviewStatus,
	}: {
		pageID?: number
		reviewStatus: ReviewStatus
	}) {
		const { list } = await request<{ list: AdminKhatmListItem[] }>('get', '/khatm/list', {
			pageID,
			reviewStatus,
			admin: 1,
		})

		return list.map((item) => ({ ...item, khatm: Khatm.fromPlain(item.khatm) }))
	}

	static async getDirectoryList(query: KhatmDirectoryQuery) {
		const result = await request<KhatmDirectoryResult>('get', '/khatm/directory', query)
		return {
			list: Khatm.fromPlainList(result.list),
			nextCursor: result.nextCursor,
		}
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
			ayah: m.range_ayah(),
			surah: m.range_surah(),
			juz: m.range_juz(),
			hizbQuarter: m.range_hizb(),
			page: m.range_page(),
			free: m.range_free(),
		}[rangeType]
	}

	static getOneItemFromRangeTitle(rangeType: RangeType) {
		return {
			ayah: m.range_one_ayah(),
			surah: m.range_one_surah(),
			juz: m.range_one_juz(),
			hizbQuarter: m.range_one_hizb(),
			page: m.range_one_page(),
			free: m.range_one_free(),
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

	get pageProgress() {
		return Math.min(100, Math.max(0, this.plain.pageProgress))
	}

	get progress() {
		return this.pageProgress / 100
	}

	get percent() {
		return roundPercent(this.pageProgress, this.finished || this.versesRead >= COUNT_OF_AYAHS)
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

	get aiReviewStatus() {
		return this.plain.aiReviewStatus || 'disabled'
	}

	get aiReviewReason() {
		return this.plain.aiReviewReason || null
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
		if (this.roundNumber === 1) return m.round_first()
		if (this.roundNumber === 2) return m.round_second()
		return m.round_number({ number: formatNumber(this.roundNumber) })
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

	get publicLink() {
		const localUrl = new URL(this.link)
		return publicWebUrl(`${localUrl.pathname}${localUrl.search}`, localUrl.origin)
	}

	getKhatmParts(merge = true) {
		if (merge) return KhatmPart.fromList(this.plainParts)
		return this.plainParts.map((part) => new KhatmPart(part)).sort((a, b) => a.start - b.start)
	}

	async pickNextAyat({ count = 1, translation }: { count: number; translation: Translation }) {
		const result = await request<PickAyahResult>('post', '/khatmPart/pickNext', {
			khatmId: this.id,
			count,
			accessToken: this.accessToken,
			translation,
		})
		const firstAyah = result.ayat[0]
		const lastAyah = result.ayat[result.ayat.length - 1]
		this.plain = result.khatm
		if (firstAyah && lastAyah) {
			this.participation.add(new QuranRange(firstAyah.index, lastAyah.index + 1), result.khatm)
		}

		return result
	}

	async share() {
		try {
			await navigator.share({
				url: this.publicLink,
				text: m.share_khatm({ title: this.title, description: this.description }),
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

	async refresh() {
		const result = await request<{ khatm: KhatmData & { parts?: KhatmPartData[] } }>('get', '/khatm', {
			khatmId: this.id,
			accessToken: this.accessToken || '',
		})
		this.plain = result.khatm
		this.plainParts = result.khatm.parts || []
	}

	async update({ reviewStatus }: Pick<KhatmData, 'reviewStatus'>) {
		const { khatm } = await request<{ khatm: KhatmData }>('post', '/khatm/update', {
			id: this.id,
			reviewStatus,
		})
		this.plain = khatm
	}

	async pickRange(range: QuranRange) {
		const updated = await request<KhatmData>('post', '/khatmPart/pickRange', {
			start: range.start,
			end: range.end,
			khatmId: this.id,
			accessToken: this.accessToken,
		})

		this.plain = updated
		this.participation.add(range, updated)
	}
}
