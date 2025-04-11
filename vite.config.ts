import { svelteTesting } from '@testing-library/svelte/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import icons from 'unplugin-icons/vite'
import UnoCSS from 'unocss/vite'
import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [
		sveltekit(),
		UnoCSS(),
		icons({ autoInstall: true, compiler: 'svelte' }),
		legacy({
			renderLegacyChunks: false,
			renderModernChunks: true,
			modernPolyfills: true,
			modernTargets: ['edge>=79, firefox>=67, chrome>=64, safari>=12'],
		}),
	],

	build: {
		target: ['edge79', 'firefox67', 'chrome64', 'safari12'],
	},

	test: {
		workspace: [
			{
				extends: './vite.config.ts',
				plugins: [svelteTesting()],

				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts'],
				},
			},
			{
				extends: './vite.config.ts',

				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
				},
			},
		],
	},
})
