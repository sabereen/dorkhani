import { defineConfig, presetWind3, transformerVariantGroup } from 'unocss'
import { presetDaisy } from '@unscatty/unocss-preset-daisy'
import presetLegacyCompat from '@unocss/preset-legacy-compat'

export default defineConfig({
	presets: [
		presetWind3({
			dark: 'media',
		}),
		presetDaisy({
			rtl: true,
			themes: ['autumn', 'forest'],
			darkTheme: 'forest',
		}),
		presetLegacyCompat({
			legacyColorSpace: true,
			commaStyleColorFunction: true,
		}),
	],
	transformers: [transformerVariantGroup()],
	outputToCssLayers: false,
})
