function prepareKey(key: string) {
	return `app_v1_${key}`
}

export const localStore = {
	set(key: string, value: unknown) {
		key = prepareKey(key)
		localStorage.setItem(key, JSON.stringify(value))
	},

	get(key: string) {
		key = prepareKey(key)
		const data = localStorage.getItem(key)
		return data == null ? null : JSON.parse(data)
	},

	getOrDefault<T>(key: string, defaultValue: T) {
		key = prepareKey(key)
		const data = localStorage.getItem(key)
		return data == null ? defaultValue : JSON.parse(data)
	},

	remove(key: string) {
		key = prepareKey(key)
		localStorage.removeItem(key)
	},
}
