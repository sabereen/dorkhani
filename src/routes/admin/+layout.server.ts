import type { LayoutServerLoad } from './$types'
import { auth_ensureIsAdmin } from '$service/auth'

export const load: LayoutServerLoad = (event) => {
	auth_ensureIsAdmin(event)
}
