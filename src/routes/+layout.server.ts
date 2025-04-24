import { appSettings_store } from '$service/appSettings'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = () => {
	const { supportLink } = appSettings_store.config

	return {
		supportLink,
	}
}
