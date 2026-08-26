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
		return { invitation: 'شارك في هذا الختم الجماعي', progress: 'نسبة التقدّم', completed: 'اكتمل الختم' }
	}
	if (locale === 'en') {
		return { invitation: 'Join this collective Quran reading', progress: 'Reading progress', completed: 'Khatm completed' }
	}
	return { invitation: 'در این ختم جمعی همراه شوید', progress: 'میزان پیشرفت', completed: 'ختم به پایان رسیده است' }
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
		<div class="card" dir="${direction}" lang="${card.locale}">
			<div class="orb orb-one"></div><div class="orb orb-two"></div>
			<div class="arch"><div class="arch-inner"><span>۞</span></div></div>
			<section class="content">
				<header><div class="brand-mark">۞</div><strong>${escapeHtml(truncate(card.brand, 50))}</strong></header>
				<div class="eyebrow">${status}</div>
				<h1>${title}</h1>
				${description ? `<p>${description}</p>` : ''}
				${badge ? `<span class="badge">${badge}</span>` : ''}
			</section>
			${progress == null ? '' : `<section class="progress"><div class="ring"${progressStyle}><div class="ring-inner"><strong>${progressText}</strong><span>${text.progress}</span></div></div><div class="progress-copy"><strong>${card.completed ? text.completed : text.invitation}</strong><span>${text.progress}</span></div></section>`}
			<footer><span>${escapeHtml(truncate(card.brand, 50))}</span><span>quran</span></footer>
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
.card { width: 1200px; height: 630px; position: relative; overflow: hidden; display: flex; align-items: stretch; padding: 62px 72px 52px; background: #07110f; color: #f7f5ef; font-family: Vazirmatn, sans-serif; }
.card:before { content: ''; position: absolute; top: 0; right: 0; bottom: 0; left: 0; background: linear-gradient(135deg, #07110f 0%, #103c35 52%, #0a211d 100%); }
.orb { position: absolute; border-radius: 999px; opacity: .42; }
.orb-one { width: 430px; height: 430px; top: -180px; right: -90px; background: #d6b46a; }
.orb-two { width: 310px; height: 310px; bottom: -150px; left: 330px; background: #39a986; }
.arch { position: absolute; top: 0; bottom: 0; right: 0; width: 448px; display: flex; align-items: center; justify-content: center; background: rgba(247,245,239,.07); }
.arch-inner { width: 342px; height: 420px; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(214,180,106,.78); border-bottom: 0; border-radius: 180px 180px 0 0; box-shadow: 0 0 0 24px rgba(247,245,239,.04), 0 0 0 48px rgba(214,180,106,.06); color: #f1d58f; font-size: 135px; }
.content, .progress, footer { position: relative; z-index: 1; }
.content { width: 670px; display: flex; flex-direction: column; align-items: flex-start; }
header { display: flex; align-items: center; font-size: 25px; color: #f7f5ef; }
.brand-mark { width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; margin-inline-end: 14px; border-radius: 15px; background: #d6b46a; color: #07110f; font-size: 27px; }
.eyebrow { margin-top: 62px; color: #f1d58f; font-size: 25px; font-weight: 700; }
h1 { max-width: 650px; max-height: 210px; margin: 14px 0 0; overflow: hidden; font-size: 62px; font-weight: 700; line-height: 1.38; letter-spacing: -.8px; }
p { max-width: 620px; max-height: 74px; margin: 20px 0 0; overflow: hidden; color: #d5e8df; font-size: 25px; line-height: 1.5; }
.badge { margin-top: 25px; padding: 10px 17px; border: 1px solid rgba(241,213,143,.64); border-radius: 999px; background: rgba(7,17,15,.28); color: #f7f5ef; font-size: 21px; }
.progress { position: absolute; z-index: 2; right: 82px; bottom: 105px; width: 340px; display: flex; flex-direction: column; align-items: center; text-align: center; }
.ring { width: 210px; height: 210px; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 999px; transform: rotate(-28deg); }
.ring-inner { width: 164px; height: 164px; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 999px; background: #0b332b; transform: rotate(28deg); }
.ring-inner strong { font-size: 43px; line-height: 1; }
.ring-inner span { margin-top: 9px; color: #c8dbd3; font-size: 17px; }
.progress-copy { margin-top: 23px; display: flex; flex-direction: column; }
.progress-copy strong { color: #f7f5ef; font-size: 22px; }
.progress-copy span { margin-top: 6px; color: #c8dbd3; font-size: 18px; }
footer { position: absolute; right: 72px; bottom: 28px; left: 72px; display: flex; justify-content: space-between; color: rgba(247,245,239,.66); font-size: 17px; letter-spacing: .8px; }
`
