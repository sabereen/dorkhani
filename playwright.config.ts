import { defineConfig } from '@playwright/test'

const baseline = process.env.VISUAL_BASELINE_DIR

export default defineConfig({
	testDir: './tests/visual',
	outputDir: './work/visual-results',
	snapshotPathTemplate: '{testDir}/../../work/visual-baselines/{projectName}/{testName}/{arg}{ext}',
	fullyParallel: true,
	workers: 4,
	timeout: 60_000,
	reporter: [['list'], ['html', { outputFolder: 'work/visual-report', open: 'never' }]],
	use: {
		baseURL: 'http://127.0.0.1:4273',
		browserName: 'chromium',
		launchOptions: {
			executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
		},
		reducedMotion: 'reduce',
		serviceWorkers: 'block',
		trace: 'retain-on-failure',
	},
	projects: [
		...[360, 768, 1200].flatMap((width) =>
			(['light', 'dark'] as const).map((colorScheme) => ({
				name: `fa-${colorScheme}-${width}`,
				metadata: { appLocale: 'fa' },
				use: { viewport: { width, height: 900 }, colorScheme },
			})),
		),
		...(
			[
				['light', 360],
				['dark', 1200],
			] as const
		).map(([colorScheme, width]) => ({
			name: `en-${colorScheme}-${width}`,
			metadata: { appLocale: 'en' },
			use: { viewport: { width, height: 900 }, colorScheme },
		})),
	],
	webServer: [
		{
			command: 'node tests/visual/server.mjs',
			port: 4273,
			reuseExistingServer: false,
		},
		...(baseline
			? [
					{
						command: 'node tests/visual/server.mjs',
						port: 4274,
						env: { VISUAL_BUILD_DIR: baseline, VISUAL_SERVER_PORT: '4274' },
						reuseExistingServer: false,
					},
				]
			: []),
	],
})
