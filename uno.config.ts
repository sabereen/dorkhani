import { defineConfig, presetWind3, transformerVariantGroup, transformerDirectives } from 'unocss'
import presetLegacyCompat from '@unocss/preset-legacy-compat'

import { designSystem } from './uno/design-system'
import layout from './uno/shortcuts/layout'
import primitives from './uno/shortcuts/primitives'
import legal_forms_settings from './uno/shortcuts/legal-forms-settings'
import feedback_lists from './uno/shortcuts/feedback-lists'
import zekr from './uno/shortcuts/zekr'
import navigation from './uno/shortcuts/navigation'
import participation from './uno/shortcuts/participation'
import auth_admin from './uno/shortcuts/auth-admin'
import directory from './uno/shortcuts/directory'
import range_picker from './uno/shortcuts/range-picker'
import error from './uno/shortcuts/error'
import landing from './uno/shortcuts/landing'
import share from './uno/shortcuts/share'
import range_icon from './uno/shortcuts/range-icon'
import create from './uno/shortcuts/create'
import created from './uno/shortcuts/created'
import history from './uno/shortcuts/history'
import directory_page from './uno/shortcuts/directory-page'
import offline_detail from './uno/shortcuts/offline-detail'
import offline_form from './uno/shortcuts/offline-form'
import offline_reading from './uno/shortcuts/offline-reading'
import offline_page from './uno/shortcuts/offline-page'
import account from './uno/shortcuts/account'
import admin_review from './uno/shortcuts/admin-review'

const ui = designSystem([
	layout,
	primitives,
	legal_forms_settings,
	feedback_lists,
	zekr,
	navigation,
	participation,
	auth_admin,
	directory,
	range_picker,
	error,
	landing,
	share,
	range_icon,
	create,
	created,
	history,
	directory_page,
	offline_detail,
	offline_form,
	offline_reading,
	offline_page,
	account,
	admin_review,
])

export default defineConfig({
	content: {
		// SvelteKit's document shell and imperative validation elements bypass Vite's UI scan.
		filesystem: ['src/app.html', 'src/lib/actions/**/*.ts'],
	},
	theme: {
		colors: {
			'ui-accent': 'var(--ui-color-accent)',
			'ui-accent-soft': 'var(--ui-color-accent-soft)',
			'ui-border': 'var(--ui-color-border)',
			'ui-border-strong': 'var(--ui-color-border-strong)',
			'ui-control-border': 'var(--ui-color-control-border)',
			'ui-control-hover': 'var(--ui-color-control-hover)',
			'ui-control-surface': 'var(--ui-color-control-surface)',
			'ui-danger': 'var(--ui-color-danger)',
			'ui-danger-soft': 'var(--ui-color-danger-soft)',
			'ui-disabled-border': 'var(--ui-color-disabled-border)',
			'ui-disabled-surface': 'var(--ui-color-disabled-surface)',
			'ui-disabled-text': 'var(--ui-color-disabled-text)',
			'ui-error': 'var(--ui-color-error)',
			'ui-info': 'var(--ui-color-info)',
			'ui-info-soft': 'var(--ui-color-info-soft)',
			'ui-landing-accent': 'var(--ui-color-landing-accent)',
			'ui-landing-accent-hover': 'var(--ui-color-landing-accent-hover)',
			'ui-landing-accent-text': 'var(--ui-color-landing-accent-text)',
			'ui-landing-glow': 'var(--ui-color-landing-glow)',
			'ui-landing-hero-muted': 'var(--ui-color-landing-hero-muted)',
			'ui-landing-hero-text': 'var(--ui-color-landing-hero-text)',
			'ui-on-danger': 'var(--ui-color-on-danger)',
			'ui-on-primary': 'var(--ui-color-on-primary)',
			'ui-on-success': 'var(--ui-color-on-success)',
			'ui-overlay': 'var(--ui-color-overlay)',
			'ui-page': 'var(--ui-color-page)',
			'ui-primary': 'var(--ui-color-primary)',
			'ui-primary-active': 'var(--ui-color-primary-active)',
			'ui-primary-hover': 'var(--ui-color-primary-hover)',
			'ui-primary-soft': 'var(--ui-color-primary-soft)',
			'ui-primary-softer': 'var(--ui-color-primary-softer)',
			'ui-success': 'var(--ui-color-success)',
			'ui-success-soft': 'var(--ui-color-success-soft)',
			'ui-surface': 'var(--ui-color-surface)',
			'ui-surface-inset': 'var(--ui-color-surface-inset)',
			'ui-surface-muted': 'var(--ui-color-surface-muted)',
			'ui-surface-raised': 'var(--ui-color-surface-raised)',
			'ui-surface-strong': 'var(--ui-color-surface-strong)',
			'ui-text': 'var(--ui-color-text)',
			'ui-text-muted': 'var(--ui-color-text-muted)',
			'ui-text-soft': 'var(--ui-color-text-soft)',
			'ui-text-subtle': 'var(--ui-color-text-subtle)',
			'ui-warning': 'var(--ui-color-warning)',
			'ui-warning-soft': 'var(--ui-color-warning-soft)',
		},
		borderRadius: {
			'ui-sm': 'var(--ui-radius-sm)',
			'ui-md': 'var(--ui-radius-md)',
			'ui-lg': 'var(--ui-radius-lg)',
			'ui-xl': 'var(--ui-radius-xl)',
		},
		fontFamily: { 'ui-sans': 'var(--ui-font-sans)' },
	},
	layers: ui.layers,
	variants: [ui.variant],
	rules: [
		// Background shorthand intentionally clears images when a surface changes.
		[/^surface-([\w-]+)$/, ([, token]) => ({ background: `var(--ui-color-${token})` })],
		[/^shadow-ui-(sm|md|lg|inset)$/, ([, size]) => ({ 'box-shadow': `var(--ui-shadow-${size})` })],
	],
	presets: [
		presetWind3({
			dark: 'media',
		}),
		presetLegacyCompat({
			legacyColorSpace: true,
			commaStyleColorFunction: true,
		}),
	],
	transformers: [transformerVariantGroup(), transformerDirectives()],
	outputToCssLayers: false,
	postprocess: [
		(util) => {
			// support old browsers gap
			util.entries.forEach((entry) => {
				if (entry[0] === 'gap') entry[0] = 'grid-gap'
				if (entry[0] === 'row-gap') entry[0] = 'grid-row-gap'
				if (entry[0] === 'column-gap') entry[0] = 'grid-column-gap'
			})
		},
	],
	shortcuts: {
		mirror: '-scale-x-100',
		center: 'flex justify-center items-center',
		'ui-row': 'flex items-center',
		'ui-inline-center': 'inline-flex items-center justify-center',
		'ui-stack': 'flex flex-col',
		'ui-grid': 'grid grid-cols-[minmax(0,1fr)]',
		'ui-grid-range': '[grid-row-start:var(--range-start)] [grid-row-end:var(--range-end)]',
		'ui-grid-column': '[grid-column-start:var(--range-column)]',
		...ui.shortcuts,
	},
})
