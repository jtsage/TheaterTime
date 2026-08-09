import { defineConfig } from 'vite'

export default defineConfig({
	assetsInclude : ['./static/*'],
	base : '/tts/',
	server : {
		port : 3000,
		host : true,
		headers : {
			'Cross-Origin-Embedder-Policy' : 'require-corp',
			'Cross-Origin-Opener-Policy' : 'same-origin',
		},
	},
	optimizeDeps : {
		exclude : ['@realtimex/piper-tts-web'],
	},
	build : {
		minify : false,
		target : 'esnext',
		rollupOptions : {
			output : {
				format : 'es',
				entryFileNames : 'assets/[name].js',
				chunkFileNames : 'assets/[name].js',
				assetFileNames : 'assets/[name].[ext]',
			},
		},
	},
})
