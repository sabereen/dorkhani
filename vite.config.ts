import { svelteTesting } from '@testing-library/svelte/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import icons from 'unplugin-icons/vite'
import UnoCSS from 'unocss/vite'
import packageJson from './package.json'
import { defineConfig } from 'vite'
import { paraglideVitePlugin } from '@inlang/paraglide-js'

export default defineConfig({
	plugins: [
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			outputStructure: 'message-modules',
			emitTsDeclarations: true,
			strategy: ['cookie', 'custom-preference', 'url', 'baseLocale'],
			trailingSlash: 'never',
			routeStrategies: [
				{ match: '/admin', strategy: ['baseLocale'] },
				{ match: '/admin/:path(.*)?', strategy: ['baseLocale'] },
				{ match: '/api/admin', strategy: ['baseLocale'] },
				{ match: '/api/admin/:path(.*)?', strategy: ['baseLocale'] },
				{
					match: '/api/:path(.*)?',
					strategy: ['cookie', 'custom-preference', 'baseLocale'],
				},
			],
		}),
		UnoCSS(),
		icons({ autoInstall: true, compiler: 'svelte' }),
	],

	build: {
		target: packageJson.browserslist.split(', ').map((b) => b.replaceAll('>=', '')),
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
