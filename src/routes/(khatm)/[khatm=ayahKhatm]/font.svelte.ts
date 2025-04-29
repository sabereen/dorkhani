/** @unocss-include */

import '@ghoran/text/fonts/uthmanic-hafs/style.css'
import { noop } from '$lib/utility/noop'
import type { Ayah } from '@ghoran/entity'
import { SvelteSet } from 'svelte/reactivity'

export type FontSlug = 'hafs' | 'qpc1' | 'qpc2'

export interface FontManager {
	readonly font: FontSlug
	get className(): string
	preloadAyah(ayah: Ayah): Promise<void>
	getFontFamily(ayah: Ayah): string
	isLoading(ayah: Ayah): boolean
}

export function getFontManager(font: FontSlug): FontManager {
	switch (font) {
		case 'hafs':
			return new HafsFontManager()
		case 'qpc1':
			return new QPCFontManagerV1()
		case 'qpc2':
			return new QPCFontManagerV2()
	}
}

export class HafsFontManager implements FontManager {
	font: FontSlug = 'hafs'
	loading = $state(false)

	get className() {
		return 'text-3xl'
	}

	isLoading() {
		return this.loading
	}

	async preloadAyah() {
		if (this.loading) return
		this.loading = true
		try {
			await document.fonts.load('30px uthmanic-hafs')
		} finally {
			this.loading = false
		}
	}

	getFontFamily() {
		return `'uthmanic-hafs', 'uthmanic-hafs-fallback'`
	}
}

abstract class QPCFontManager implements FontManager {
	abstract readonly version: 1 | 2
	abstract readonly font: 'qpc1' | 'qpc2'
	abstract get className(): string

	private loadingPages = $state(new SvelteSet<number>())
	private loadedPages = $state(new SvelteSet<number>())

	isLoading(ayah: Ayah): boolean {
		return this.loadingPages.has(ayah.pageNumber)
	}

	async preloadAyah(ayah: Ayah) {
		await this.load(ayah.pageNumber)
		this.load(ayah.pageNumber + 1).catch(noop)
	}

	getFontFamily(ayah: Ayah): string {
		return `qpc-v${this.version}-${ayah.pageNumber}`
	}

	async load(pageNumber: number) {
		if (this.loadingPages.has(pageNumber) || this.loadedPages.has(pageNumber)) return
		this.loadingPages.add(pageNumber)

		try {
			const src = `/api/font?font=qpc-v${this.version}&page=${pageNumber}`
			const fontFamily = `qpc-v${this.version}-${pageNumber}`
			const fontFace = new FontFace(fontFamily, `url(${src})`, { display: 'block' })
			document.fonts.add(fontFace)
			await document.fonts.load(`30px ${fontFamily}`)
			this.loadedPages.add(pageNumber)
		} finally {
			this.loadingPages.delete(pageNumber)
		}
	}
}

export class QPCFontManagerV1 extends QPCFontManager {
	readonly version = 1
	readonly font = 'qpc1'
	get className() {
		return 'text-[34px] break-all'
	}
}

export class QPCFontManagerV2 extends QPCFontManager {
	readonly version = 2
	readonly font = 'qpc2'
	get className() {
		return 'text-3xl break-all'
	}
}
