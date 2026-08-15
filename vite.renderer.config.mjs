import { defineConfig } from 'vite'
// import { resolve } from 'node:path'

// https://vitejs.dev/config
export default defineConfig( {
	optimizeDeps : {
		exclude : [
			'onnxruntime-web'
		],
	},
	css : {
		preprocessorOptions : {
			scss : {
				api : 'modern-compiler',
				silenceDeprecations : [
					'import',
					'mixed-decls',
					'color-functions',
					'global-builtin',
				],
				quietDeps : true,
			},
		},
	},
} )
