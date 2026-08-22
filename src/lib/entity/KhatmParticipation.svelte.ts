import { COUNT_OF_AYAHS } from '@ghoran/metadata/constants'
import type { KhatmData } from './KhatmData'
import { PickedKhatmPart } from './PickedKhatmPart'
import type { QuranRange } from './Range'
import { roundPercent } from '$lib/utility/percent'

export type KhatmParticipationRound = {
	khatmId: number
	roundNumber: number
	verseCount: number
	items: PickedKhatmPart[]
}

export class KhatmParticipation {
	items = $state<PickedKhatmPart[]>([])
	loaded = $state(false)

	private loadId = 0

	constructor(private getKhatm: () => KhatmData) {}

	async load() {
		const loadId = ++this.loadId
		const khatm = this.getKhatm()

		try {
			const items = khatm.seriesId
				? await PickedKhatmPart.getBySeriesId(khatm.seriesId)
				: await PickedKhatmPart.getByKhatmId(khatm.id)
			if (loadId === this.loadId) {
				const uniqueItems = new Map<string, PickedKhatmPart>()
				for (const item of [...this.items, ...items]) {
					const key = [
						item.plain.khatm.id,
						item.range.start,
						item.range.end,
						item.date.getTime(),
					].join(':')
					uniqueItems.set(key, item)
				}
				this.items = Array.from(uniqueItems.values()).sort(
					(a, b) => b.date.getTime() - a.date.getTime(),
				)
			}
		} catch (err) {
			console.error(err)
		} finally {
			if (loadId === this.loadId) this.loaded = true
		}
	}

	add(range: QuranRange, khatm = this.getKhatm()) {
		const item = new PickedKhatmPart({
			id: undefined as unknown as number,
			date: new Date(),
			start: range.start,
			end: range.end,
			khatm,
			hash: khatm.accessToken,
		})

		this.items = [item, ...this.items]
		item.save().catch((err) => console.error(err))
		return item
	}

	get currentItems() {
		const khatmId = this.getKhatm().id
		return this.items.filter((item) => item.plain.khatm.id === khatmId)
	}

	get currentRanges() {
		return this.currentItems.map((item) => item.range)
	}

	get currentVerseCount() {
		return this.currentItems.reduce((sum, item) => sum + item.range.length, 0)
	}

	get currentPercent() {
		const pageProgress = this.currentRanges.reduce(
			(sum, range) => sum + range.getCoveragePercent() * 100,
			0,
		)
		return roundPercent(pageProgress, this.currentVerseCount >= COUNT_OF_AYAHS)
	}

	get rounds() {
		const grouped = new Map<number, KhatmParticipationRound>()

		for (const item of this.items) {
			const khatmId = item.plain.khatm.id
			let round = grouped.get(khatmId)
			if (!round) {
				round = {
					khatmId,
					roundNumber: item.plain.khatm.roundNumber,
					verseCount: 0,
					items: [],
				}
				grouped.set(khatmId, round)
			}
			round.verseCount += item.range.length
			round.items.push(item)
		}

		return Array.from(grouped.values()).sort((a, b) => b.roundNumber - a.roundNumber)
	}

	getOverlapLength(range: QuranRange) {
		return this.currentRanges.reduce(
			(sum, mine) =>
				sum + Math.max(0, Math.min(range.end, mine.end) - Math.max(range.start, mine.start)),
			0,
		)
	}

	isMine(range: { start: number; end: number }) {
		return this.currentRanges.some((mine) => mine.start === range.start && mine.end === range.end)
	}
}
