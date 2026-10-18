import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'

const root = resolve(process.env.VISUAL_BUILD_DIR || 'build-capacitor')
await stat(resolve(root, 'index.html')).catch(() => {
	throw new Error(
		'Build the CSR app first: PUBLIC_SERVER_ORIGIN=https://dorkhani.ir pnpm build:csr',
	)
})
const types = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
}

createServer(async (request, response) => {
	const url = new URL(request.url || '/', 'http://localhost')
	let file = resolve(root, `.${decodeURIComponent(url.pathname)}`)
	if (file !== root && !file.startsWith(root + sep)) {
		response.writeHead(403).end()
		return
	}
	if (!(await stat(file).catch(() => null))?.isFile()) file = resolve(root, 'index.html')
	try {
		response.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' })
		response.end(await readFile(file))
	} catch {
		response.writeHead(404).end()
	}
}).listen(Number(process.env.VISUAL_SERVER_PORT || 4273), '127.0.0.1')
