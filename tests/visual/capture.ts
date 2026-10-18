import type { Page } from '@playwright/test'

export async function settle(page: Page) {
	await page.evaluate(async () => {
		// Force font discovery before full-page clipping uses fallback font metrics.
		document.body.getBoundingClientRect()
		await document.fonts.ready
		await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)))
		await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
	})
}

export async function screenshot(page: Page) {
	await settle(page)
	await page.evaluate(() => {
		window.scrollTo(0, 0)
		for (const animation of document.getAnimations()) {
			if (animation.effect?.getTiming().iterations === Infinity) {
				animation.pause()
				animation.currentTime = 0
			}
		}
		// Success pages display their origin; normalize the two local server ports.
		for (const element of document.querySelectorAll('a span')) {
			if (!element.children.length && element.textContent?.includes('http://127.0.0.1:')) {
				element.textContent = element.textContent.replace(
					/http:\/\/127\.0\.0\.1:\d+/,
					'http://127.0.0.1:4270',
				)
			}
		}
	})
	return page.screenshot({ fullPage: true, animations: 'disabled' })
}
