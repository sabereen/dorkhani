export function isEmptyObject(obj?: object | null) {
	if (!obj) return true
	for (const key in obj) {
		return false
	}
	return true
}
