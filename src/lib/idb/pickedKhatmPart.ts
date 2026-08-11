import type { PickedKhatmPart } from './idb'

export async function idb_pickedKhatmPart_add(item: Omit<PickedKhatmPart, 'id'>) {
	const { db } = await import('./idb')
	// هدف از اینکه فیلدها را جداگانه نسبت دادیم این است که فیلد اضافی درون ایندکس‌دی‌بی ذخیره نکنیم
	// برای مثال تمام پارت‌های خوانده شده ختم نرود در دیتابیس لوکال ذخیره شود
	await db.pickedKhatmParts.add({
		date: item.date,
		start: item.start,
		end: item.end,
		hash: item.hash,
		khatm: {
			id: item.khatm.id,
			title: item.khatm.title,
			description: item.khatm.description,
			created: item.khatm.created,
			versesRead: item.khatm.versesRead,
			private: item.khatm.private,
			rangeType: item.khatm.rangeType,
			accessToken: item.khatm.accessToken,
			endDate: item.khatm.endDate,
			roundNumber: item.khatm.roundNumber,
			seriesId: item.khatm.seriesId,
			status: item.khatm.status,
			reviewStatus: item.khatm.reviewStatus,
		},
	})
}

export async function idb_pickedKhatmPart_getList(limit?: number) {
	const { db } = await import('./idb')
	const collection = db.pickedKhatmParts.orderBy('date').reverse()
	if (limit) {
		return collection.limit(limit).toArray()
	}
	return collection.toArray()
}

export async function idb_pickedKhatmPart_getByKhatmId(khatmId: number) {
	const { db } = await import('./idb')
	const list = await db.pickedKhatmParts.where('khatm.id').equals(khatmId).toArray()
	return list.sort((a, b) => b.date.getTime() - a.date.getTime())
}

export async function idb_pickedKhatmPart_getBySeriesId(seriesId: number) {
	const { db } = await import('./idb')
	const list = await db.pickedKhatmParts.where('khatm.seriesId').equals(seriesId).toArray()
	return list.sort((a, b) => b.date.getTime() - a.date.getTime())
}
