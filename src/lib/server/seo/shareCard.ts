import { createRequire } from 'node:module'
import { readFile } from 'node:fs/promises'
import { Renderer } from 'takumi-js/node'
import { fromHtml } from 'takumi-js/helpers/html'
import type { Locale } from '$lib/paraglide/runtime.js'

const WIDTH = 1200
const HEIGHT = 630
const require = createRequire(import.meta.url)
const renderer = new Renderer({ cacheMaxBytes: 24 * 1024 * 1024 })
let initialized: Promise<void> | undefined

type ShareCard = {
	brand: string
	title: string
	description?: string
	locale: Locale
	progress?: number
	badge?: string
	completed?: boolean
}

function escapeHtml(value: string) {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function truncate(value: string, limit: number) {
	const normalized = value.trim().replace(/\s+/g, ' ')
	return normalized.length > limit ? `${normalized.slice(0, limit - 1).trimEnd()}…` : normalized
}

function copy(locale: Locale) {
	if (locale === 'ar') {
		return {
			invitation: 'شارك في هذا الختم الجماعي',
			progress: 'نسبة التقدّم',
			completed: 'اكتمل الختم',
			snapshot: 'لقطة عند المشاركة',
		}
	}
	if (locale === 'en') {
		return {
			invitation: 'Join this collective Quran reading',
			progress: 'Reading progress',
			completed: 'Khatm completed',
			snapshot: 'Snapshot at sharing',
		}
	}
	return {
		invitation: 'در این ختم جمعی همراه شوید',
		progress: 'میزان پیشرفت',
		completed: 'ختم به پایان رسیده است',
		snapshot: 'نمای لحظهٔ اشتراک',
	}
}

function formatPercent(value: number, locale: Locale) {
	return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(Math.max(0, Math.min(100, value)))
}

async function initializeRenderer() {
	initialized ??= Promise.all([
		readFile(require.resolve('vazirmatn/fonts/webfonts/Vazirmatn-Regular.woff2')),
		readFile(require.resolve('vazirmatn/fonts/webfonts/Vazirmatn-Bold.woff2')),
	])
		.then(async ([regular, bold]) => {
			await renderer.registerFont({ name: 'Vazirmatn', data: regular, weight: 400 })
			await renderer.registerFont({ name: 'Vazirmatn', data: bold, weight: 700 })
		})
		.catch((error) => {
			initialized = undefined
			throw error
		})
	return initialized
}

export async function renderShareCard(card: ShareCard) {
	await initializeRenderer()
	const text = copy(card.locale)
	const direction = card.locale === 'en' ? 'ltr' : 'rtl'
	const progress = card.progress == null ? undefined : Math.max(0, Math.min(100, card.progress))
	const progressText = progress == null ? '' : `${formatPercent(progress, card.locale)}%`
	const progressStyle =
		progress == null
			? ''
			: ` style="background: conic-gradient(#3bc496 0 ${progress}%, #d6b46a ${progress}% 100%)"`
	const status = card.completed ? text.completed : text.invitation
	const title = escapeHtml(truncate(card.title, 132))
	const description = card.description ? escapeHtml(truncate(card.description, 170)) : ''
	const badge = card.badge ? escapeHtml(truncate(card.badge, 42)) : ''
	const html = `
		<div class="card ${direction}" lang="${card.locale}">
			<div class="orb orb-one"></div><div class="orb orb-two"></div>
			<section class="content" dir="${direction}">
				<header><div class="brand-mark">۞</div><strong>${escapeHtml(truncate(card.brand, 50))}</strong></header>
				<div class="eyebrow">${status}</div>
				<h1>${title}</h1>
				${description ? `<p>${description}</p>` : ''}
				${badge ? `<span class="badge">${badge}</span>` : ''}
			</section>
			<section class="visual" aria-hidden="true">
				<div class="arch"><div class="arch-inner"></div></div>
				${
					progress == null
						? '<div class="motif">۞</div>'
						: `<div class="progress"><div class="ring"${progressStyle}><div class="ring-inner"><strong>${progressText}</strong><span>${text.progress}</span></div></div><div class="progress-copy">${card.completed ? text.completed : text.snapshot}</div></div>`
				}
			</section>
			<footer dir="ltr"><span>${escapeHtml(truncate(card.brand, 50))}</span><span>quran</span></footer>
		</div>
	`
	const { node, stylesheets } = await fromHtml(html)
	return renderer.render(node, {
		width: WIDTH,
		height: HEIGHT,
		format: 'png',
		stylesheets: [shareCardCss, ...stylesheets],
		fontFamilies: ['Vazirmatn'],
		lang: card.locale,
	})
}

const shareCardCss = `
* { box-sizing: border-box; }
.card { width: 1200px; height: 630px; position: relative; overflow: hidden; background: #07110f; color: #f7f5ef; font-family: Vazirmatn, sans-serif; }
.card:before { content: ''; position: absolute; top: 0; right: 0; bottom: 0; left: 0; background: linear-gradient(135deg, #07110f 0%, #103c35 52%, #0a211d 100%); }
.orb { position: absolute; border-radius: 999px; opacity: .42; }
.orb-one { width: 430px; height: 430px; top: -180px; right: -90px; background: #d6b46a; }
.orb-two { width: 330px; height: 330px; bottom: -175px; left: 300px; background: #39a986; }
.content { position: absolute; z-index: 3; top: 58px; width: 690px; height: 500px; display: flex; flex-direction: column; }
.card.rtl .content { right: 70px; text-align: right; }
.card.ltr .content { left: 70px; text-align: left; }
.content header { width: 100%; display: flex; align-items: center; color: #f7f5ef; font-size: 25px; }
.content header strong { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.brand-mark { width: 48px; height: 48px; display: flex; flex: 0 0 48px; align-items: center; justify-content: center; margin-inline-end: 14px; border-radius: 15px; background: #d6b46a; color: #07110f; font-size: 27px; }
.eyebrow { margin-top: 60px; color: #f1d58f; font-size: 25px; font-weight: 700; }
h1 { width: 100%; max-height: 236px; margin: 15px 0 0; overflow: hidden; color: #fffdf6; font-size: 59px; font-weight: 700; line-height: 1.36; letter-spacing: -.6px; }
p { width: 100%; max-height: 74px; margin: 18px 0 0; overflow: hidden; color: #d5e8df; font-size: 24px; line-height: 1.55; }
.badge { align-self: flex-start; margin-top: 23px; padding: 9px 17px; border: 1px solid rgba(241,213,143,.64); border-radius: 999px; background: rgba(7,17,15,.34); color: #f7f5ef; font-size: 20px; }
.card.rtl .badge { align-self: flex-end; }
.visual { position: absolute; z-index: 2; top: 54px; width: 350px; height: 500px; }
.card.rtl .visual { left: 54px; }
.card.ltr .visual { right: 54px; }
.arch { position: absolute; top: 0; right: 0; bottom: 0; left: 0; display: flex; align-items: flex-end; justify-content: center; }
.arch-inner { width: 310px; height: 455px; border: 2px solid rgba(214,180,106,.72); border-bottom: 0; border-radius: 165px 165px 0 0; background: rgba(247,245,239,.035); box-shadow: 0 0 0 22px rgba(247,245,239,.035), 0 0 0 44px rgba(214,180,106,.045); }
.motif { position: absolute; top: 145px; right: 0; left: 0; color: #f1d58f; font-size: 118px; text-align: center; }
.progress { position: absolute; top: 108px; right: 0; left: 0; display: flex; flex-direction: column; align-items: center; text-align: center; }
.ring { width: 220px; height: 220px; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 999px; }
.ring-inner { width: 174px; height: 174px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 999px; background: #0b332b; box-shadow: 0 8px 28px rgba(0,0,0,.24); }
.ring-inner strong { font-size: 43px; line-height: 1; }
.ring-inner span { margin-top: 9px; color: #c8dbd3; font-size: 17px; }
.progress-copy { margin-top: 22px; color: #d5e8df; font-size: 18px; }
footer { position: absolute; z-index: 4; right: 70px; bottom: 26px; left: 70px; display: flex; justify-content: space-between; color: rgba(247,245,239,.62); font-size: 17px; letter-spacing: .8px; }
`
