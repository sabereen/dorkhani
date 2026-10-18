import { test, expect, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { prepareContext } from './fixtures'
import { settle, screenshot } from './capture'

async function playAudio(page: Page) {
	await page.locator('.ui-quran-ayah-footer button').first().click()
	const audio = page.locator('audio')
	await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.duration)).toBe(30)
	await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.readyState)).toBe(4)
	await expect(audio).toHaveJSProperty('paused', false)
	await audio.evaluate((element: HTMLAudioElement) => {
		element.playbackRate = 0
		// Freeze the native media element at the start for deterministic screenshots.
		element.currentTime = 0
		element.dispatchEvent(new Event('timeupdate'))
	})
	await expect(page.locator('.ui-quran-ayah-footer progress')).toBeVisible()
	await expect(page.locator('.ui-quran-ayah-footer progress')).toHaveJSProperty('value', 0)
}

for (const mode of ['reading', 'audio-progress']) {
	test(mode, async ({ page, context, browser }, info) => {
		const locale = String(info.project.metadata.appLocale)
		const theme = info.project.use.colorScheme || 'light'
		const options = { locale, theme, scenario: mode }
		await prepareContext(context, options)
		await page.goto('/k1/1:1-1:3', { waitUntil: 'networkidle' })
		await settle(page)
		const text = page.locator('.ui-quran-ayah-text').first()
		const mobile = (info.project.use.viewport?.width || 1200) <= 479
		await expect(text).toHaveCSS('opacity', '1')
		await expect(text).toHaveCSS('font-size', mobile ? '23.2px' : '27.2px')
		await expect(text).toHaveCSS('line-height', mobile ? '71.92px' : '95.2px')
		await expect(text).toHaveCSS('word-break', 'break-word')
		if (mode === 'audio-progress') {
			await playAudio(page)
			await expect(page.locator('.ui-quran-ayah-footer progress')).toHaveCSS('height', '8px')
			await expect(page.locator('.ui-quran-ayah-footer progress')).toHaveCSS(
				'border-radius',
				'9999px',
			)
		}
		const current = await screenshot(page)
		await info.attach('after', { body: current, contentType: 'image/png' })
		if (process.env.VISUAL_BASELINE_DIR) {
			const baseline = await browser.newContext({
				viewport: info.project.use.viewport,
				colorScheme: theme,
				reducedMotion: 'reduce',
				serviceWorkers: 'block',
			})
			try {
				await prepareContext(baseline, options)
				const oldPage = await baseline.newPage()
				await oldPage.goto('http://127.0.0.1:4274/k1/1:1-1:3', { waitUntil: 'networkidle' })
				await settle(oldPage)
				if (mode === 'audio-progress') await playAudio(oldPage)
				const before = await screenshot(oldPage)
				await info.attach('before', { body: before, contentType: 'image/png' })
				const expected = info.snapshotPath('before.png')
				await mkdir(dirname(expected), { recursive: true })
				await writeFile(expected, before)
				expect(current).toMatchSnapshot('before.png', { maxDiffPixels: 3, threshold: 0.08 })
			} finally {
				await baseline.close()
			}
		}
	})
}
