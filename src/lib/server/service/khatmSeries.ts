import { db } from '../db'

export async function khatmSeries_createForKhatmId(id: number) {
	const result = await db.tKhatmSeries.create({
		data: {
			id,
			khatms: { connect: { id } },
		},
	})
	return result
}
