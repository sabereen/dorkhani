import { defineConfig, presetWind3, transformerVariantGroup, transformerDirectives } from 'unocss'
import presetLegacyCompat from '@unocss/preset-legacy-compat'

export default defineConfig({
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
		center: 'flex justify-center items-center'
	},
})
