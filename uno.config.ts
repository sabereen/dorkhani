import { defineConfig, presetWind3, transformerVariantGroup, transformerDirectives } from 'unocss'
import { presetDaisy } from '@unscatty/unocss-preset-daisy'
import presetLegacyCompat from '@unocss/preset-legacy-compat'

export default defineConfig({
	presets: [
		presetWind3({
			dark: 'media',
		}),
		presetDaisy({
			rtl: true,
			darkTheme: 'forest',
			themes: [
				'autumn',
				'forest',
				'light',
				'dark',
				'cupcake',
				'bumblebee',
				'emerald',
				'corporate',
				'synthwave',
				'retro',
				'cyberpunk',
				'valentine',
				'halloween',
				'garden',
				'aqua',
				'lofi',
				'pastel',
				'fantasy',
				'wireframe',
				'black',
				'luxury',
				'dracula',
				'cmyk',
				'business',
				'acid',
				'lemonade',
				'night',
				'coffee',
				'winter',
			],
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
})
