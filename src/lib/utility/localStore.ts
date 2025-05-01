export const localStore = {
	prepareKey(key: string) {
		return `app_v1_${key}`
	},

	set(key: string, value: unknown) {
		key = this.prepareKey(key)
		localStorage.setItem(key, JSON.stringify(value))
	},

	get(key: string) {
		key = this.prepareKey(key)
		const data = localStorage.getItem(key)
		return data == null ? null : JSON.parse(data)
	},

	getOrDefault<T>(key: string, defaultValue: T) {
		key = this.prepareKey(key)
		const data = localStorage.getItem(key)
		return data == null ? defaultValue : JSON.parse(data)
	},

	remove(key: string) {
		key = this.prepareKey(key)
		localStorage.removeItem(key)
	},
}
