import presetEnv from 'postcss-preset-env'

export default {
	plugins: [
		presetEnv({
			features: {
				'logical-properties-and-values': false,
			},
		}),
	],
}
