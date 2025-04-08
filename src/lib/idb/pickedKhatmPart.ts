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
		},
	})
}

export async function idb_pickedKhatmPart_getList(limit?: number) {
	const { db } = await import('./idb')
	if (limit) {
		return db.pickedKhatmParts.reverse().limit(limit).toArray()
	}
	return db.pickedKhatmParts.toArray()
}
