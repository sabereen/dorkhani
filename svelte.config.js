import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess({ style: false, script: true }),

	kit: {
		adapter: adapter(),
		alias: {
			$api: 'src/routes/api',
			$service: 'src/lib/server/service',
		},
		paths: {
			base: process.env.BASE_PATH || '',
			relative: false,
		},
	},
}

export default config
