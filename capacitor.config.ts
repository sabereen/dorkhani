import 'dotenv/config'
import type { CapacitorConfig } from '@capacitor/cli'

const signingValues = [
	process.env.ANDROID_KEYSTORE_PATH,
	process.env.ANDROID_KEYSTORE_PASSWORD,
	process.env.ANDROID_KEY_ALIAS,
	process.env.ANDROID_KEY_PASSWORD,
]
const hasSigningConfig = signingValues.every(Boolean)
if (!hasSigningConfig && signingValues.some(Boolean)) {
	throw new Error('All Android signing environment variables must be configured together.')
}

const config: CapacitorConfig = {
	appId: 'ir.dorkhani.app',
	appName: 'دورخوانی',
	webDir: 'build-capacitor',
	server: {
		hostname: 'localhost',
		androidScheme: 'https',
	},
	android: {
		buildOptions: hasSigningConfig
			? {
					keystorePath: process.env.ANDROID_KEYSTORE_PATH,
					keystorePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
					keystoreAlias: process.env.ANDROID_KEY_ALIAS,
					keystoreAliasPassword: process.env.ANDROID_KEY_PASSWORD,
					releaseType: 'AAB',
					signingType: 'apksigner',
				}
			: undefined,
	},
}

export default config
