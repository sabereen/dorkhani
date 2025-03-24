import type { PickedKhatmPart } from './idb'

export async function idb_pickedKhatmPart_add(item: Omit<PickedKhatmPart, 'id'>) {
	const { db } = await import('./idb')
	// هدف از اینکه فیلدها را جداگانه نسبت دادیم این است که فیلد اضافی درون ایندکس‌دی‌بی ذخیره نکنیم
	// برای مثال تمام پارت‌های خوانده شده ختم نرود در دیتابیس لوکال ذخیره شود
	db.pickedKhatmParts.add({
		date: item.date,
		start: item.start,
		end: item.end,
		khatm: {
			id: item.khatm.id,
			title: item.khatm.title,
			description: item.khatm.description,
		},
	})
}

export async function idb_pickedKhatmPart_getList() {
	const { db } = await import('./idb')
	const list = await db.pickedKhatmParts.toArray()
	return list
}
