import fs from 'node:fs'
import path from 'node:path'

const electron_path = path.join(import.meta.dirname, '..', 'src', 'render', 'inc', 'tts')
const electron_base = path.join(import.meta.dirname, '..', 'src', 'render')
const build_path    = path.join(import.meta.dirname, 'dist', 'assets')
const static_path   = path.join(import.meta.dirname, 'static-includes')

const static_files = [
	'ort-wasm-simd-threaded.jsep.mjs',
	'piper_phonemize.data',
	'piper_phonemize.wasm',
]

for ( const file of static_files ) {
	fs.copyFileSync(path.join(static_path, file), path.join(build_path, file))
}

fs.rmSync(electron_path, { recursive : true, force : true })
fs.mkdirSync(electron_path, true)
fs.cpSync(build_path, electron_path, { recursive : true })
fs.cpSync(path.join(electron_path, 'ort-wasm-simd-threaded.jsep.wasm'), path.join(electron_base, 'ort-wasm-simd-threaded.jsep.wasm'))
fs.rmSync(path.join(electron_path, 'ort-wasm-simd-threaded.jsep.wasm'))
