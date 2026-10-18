import { test, expect, type Page } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { prepareContext } from './fixtures'
import { settle, screenshot } from './capture'

const pages = [
	['home', '/'],
	['directory', '/list'],
	['create', '/add'],
	['settings', '/settings'],
	['history', '/history'],
	['privacy', '/privacy'],
	['terms', '/terms'],
	['login', '/auth/login'],
	['register', '/auth/register'],
	['forgot', '/auth/forgot-password'],
	['reset', '/auth/reset-password?token=visual'],
	['account', '/account'],
	['edit', '/account/khatms/1/edit'],
	['wizard', '/k1'],
	['khatm-list', '/k1/list'],
	['khatm-grid', '/k1/grid'],
	['ayah', '/a2'],
	['zekr', '/z3'],
	['error', '/not-found'],
	['offline', '/offline-khatm'],
	['menu', '/'],
	['language', '/'],
	['share', '/k1'],
	['ranges', '/k1'],
	['confirm-range', '/k1'],
	['grid-filtered', '/k1/grid'],
	['sign-out', '/account'],
	['create-ayah', '/add?rangeType=ayah'],
	['created', '/add'],
	['validation', '/auth/login'],
	['zekr-loading', '/z3'],
	['login-loading', '/auth/login'],
	['offline-detail', '/offline-khatm'],
	['offline-grid', '/offline-khatm'],
	['offline-edit', '/offline-khatm'],
	['spinner-variants', '/auth/login'],
] as const

async function interact(page: Page, name: string) {
	if (name === 'spinner-variants') {
		await page.evaluate(() => {
			const fixture = document.createElement('section')
			fixture.innerHTML = [
				'<div class="ui-zekr-primary-action"><span class="ui-spinner" data-testid="variant-spinner"></span></div>',
				'<div class="ui-zekr-modal-form"><button class="ui-btn ui-btn-primary ui-btn-block"><span class="ui-spinner" data-testid="variant-spinner"></span></button></div>',
				...['ui-auth-form', 'ui-admin-form-actions', 'ui-admin-settings-actions'].map(
					(wrapper) =>
						`<div class="${wrapper}"><button class="ui-btn ui-btn-primary"><span class="ui-spinner" data-testid="variant-spinner"></span></button></div>`,
				),
			].join('')
			document.querySelector('main')?.append(fixture)
		})
	} else if (name === 'menu' || name === 'language') {
		await page.locator('.ui-header-menu-button').click()
		if (name === 'language') await page.locator('.ui-modal button.ui-nav-link').first().click()
	} else if (name === 'share') await page.locator('.ui-header-page-action-primary').click()
	else if (name === 'ranges' || name === 'confirm-range') {
		await page.locator('.ui-khatm-commitment').first().click()
		if (name === 'confirm-range')
			await page.locator('.ui-khatm-range-card:not([disabled])').first().click()
	} else if (name === 'grid-filtered')
		await page.locator('.ui-khatm-map-toolbar input').first().check()
	else if (name === 'sign-out')
		await page
			.locator('.ui-account-profile-actions button, .account-profile-actions button')
			.first()
			.click()
	else if (name === 'created') {
		await page.locator('input[name=title]').fill('ختم آزمایشی برای سلامتی')
		await page.locator('textarea[name=description]').fill('با هم قرآن می‌خوانیم')
		await page.locator('button[type=submit]').click()
		await expect(page.locator('.ui-success-shell, .success-shell')).toBeVisible()
	} else if (name === 'validation') {
		await page.locator('button[type=submit]').click()
		await page.locator('input[type=email]').focus()
	} else if (name === 'login-loading') {
		await page.locator('input[type=email]').fill('reader@example.com')
		await page.locator('input[type=password]').fill('visual-test-password')
		await page.locator('button[type=submit]').click()
	} else if (name === 'zekr-loading') await page.locator('.ui-zekr-primary-action').click()
	else if (name.startsWith('offline-')) {
		await page.locator('#offline-khatm-title').fill('ختم آفلاین آزمایشی')
		await page
			.locator('.ui-offline-form button[type=submit], .offline-form button[type=submit]')
			.click()
		await expect(page.locator('.ui-offline-actions, .offline-actions')).toBeVisible()
		if (name === 'offline-grid')
			await page
				.locator('.ui-offline-view-switch button, .offline-view-switch button')
				.last()
				.click()
		if (name === 'offline-edit')
			await page.locator('.ui-offline-actions button, .offline-actions button').first().click()
	}
}

for (const [name, path] of pages) {
	test(name, async ({ page, context, browser }, info) => {
		const locale = String(info.project.metadata.appLocale)
		const theme = info.project.use.colorScheme || 'light'
		const options = { locale, theme, scenario: name }
		const errors: string[] = []
		page.on('pageerror', (error) => errors.push(error.message))
		await prepareContext(context, options)
		await page.goto(path, { waitUntil: 'networkidle' })
		await settle(page)
		await interact(page, name)
		await page.waitForTimeout(400)
		expect(errors).toEqual([])
		await expect(page.locator('html')).toHaveAttribute('dir', locale === 'en' ? 'ltr' : 'rtl')

		if (name === 'settings') {
			await expect(page.locator('.ui-scheme-preview-dark')).toHaveCSS(
				'background-color',
				'rgb(7, 17, 15)',
			)
			await expect(page.locator('.ui-scheme-preview-system')).toHaveCSS(
				'background-image',
				/linear-gradient/,
			)
		}
		if (name === 'create' || name === 'create-ayah') {
			await expect(page.locator('.ui-add-form')).toHaveCSS(
				'border-top-color',
				theme === 'dark' ? 'rgb(85, 200, 160)' : 'rgb(23, 107, 85)',
			)
		}
		if (name === 'offline')
			await expect(page.locator('.ui-offline-form')).toHaveCSS('margin-top', '0px')
		if (name === 'edit')
			await expect(page.locator('fieldset .ui-card-body').first()).toHaveCSS('display', 'flex')
		if (name === 'share')
			await expect(page.locator('.ui-modal .text-xs').first()).toHaveCSS('line-height', '12px')
		if (name.endsWith('-loading'))
			await expect(page.locator('.ui-spinner').first()).toHaveCSS(
				'border-top-color',
				'rgba(0, 0, 0, 0)',
			)
		if (name === 'spinner-variants') {
			for (const spinner of await page.getByTestId('variant-spinner').all()) {
				await expect(spinner).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)')
			}
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
				await oldPage.goto(`http://127.0.0.1:4274${path}`, { waitUntil: 'networkidle' })
				await settle(oldPage)
				await interact(oldPage, name)
				await oldPage.waitForTimeout(400)
				const before = await screenshot(oldPage)
				await info.attach('before', { body: before, contentType: 'image/png' })
				const expected = info.snapshotPath('before.png')
				await mkdir(dirname(expected), { recursive: true })
				await writeFile(expected, before)
				// Allow a few antialiased edge pixels, never layout or meaningful color changes.
				expect(current).toMatchSnapshot('before.png', { maxDiffPixels: 3, threshold: 0.08 })
			} finally {
				await baseline.close()
			}
		}
	})
}
