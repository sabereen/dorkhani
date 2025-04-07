import { env } from '$env/dynamic/private'
import { PUBLIC_FONT_PROXY } from '$env/static/public'

export const PRIVATE_KHATM_SECRET = env.PRIVATE_KHATM_SECRET || 'SECRET'

export const FONT_PROXY = PUBLIC_FONT_PROXY === '1'
