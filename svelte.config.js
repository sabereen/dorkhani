import nodeAdapter from '@sveltejs/adapter-node'
import staticAdapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

const buildTarget = process.env.PUBLIC_BUILD_TARGET || 'web'
if (buildTarget !== 'web' && buildTarget !== 'capacitor') {
	throw new Error('PUBLIC_BUILD_TARGET must be either "web" or "capacitor".')
}

const isCapacitor = buildTarget === 'capacitor'
if (isCapacitor) {
	const serverOrigin = process.env.PUBLIC_SERVER_ORIGIN
	let isValidServerOrigin = false
	try {
		const url = new URL(serverOrigin || '')
		isValidServerOrigin =
			url.protocol === 'https:' &&
			url.origin === serverOrigin?.replace(/\/$/, '') &&
			url.origin === 'https://dorkhani.ir'
	} catch {
		isValidServerOrigin = false
	}
	if (!isValidServerOrigin) {
		throw new Error('PUBLIC_SERVER_ORIGIN must be https://dorkhani.ir for capacitor builds.')
	}
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess({ style: false, script: true }),

	kit: {
		adapter: isCapacitor
			? staticAdapter({
					pages: 'build-capacitor',
					assets: 'build-capacitor',
					fallback: 'index.html',
					strict: false,
				})
			: nodeAdapter(),
		alias: {
			$api: 'src/routes/api',
			$service: 'src/lib/server/service',
			'@prisma-client': 'src/lib/server/generated/prisma/client',
		},
		paths: {
			base: isCapacitor ? '' : process.env.BASE_PATH || '',
			relative: false,
		},
		serviceWorker: isCapacitor ? { register: false } : { register: true },
	},
}

export default config
