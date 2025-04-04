import tailwindcss from '@tailwindcss/vite'
import { svelteTesting } from '@testing-library/svelte/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import icons from 'unplugin-icons/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss(),
		icons({ autoInstall: true, compiler: 'svelte' }),
		viteStaticCopy({
			targets: [
				{
					src: 'node_modules/@ghoran/font-page/fonts/qpc-v1/woff2',
					dest: 'fonts/qpc-v1',
				},
			],
			watch: {
				options: {
					ignored() {
						return true
					},
				},
			},
		}),
	],

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
