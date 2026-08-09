import * as tts from './custom-piper-tts/index.js'

const audioSystem = {
	blocked    : false,
	chimes     : null,
	debug      : true,
	enabled    : true,
	session    : null,
	sinkID     : null,
	speakAudio : null,
	stack      : [],
	voiceID    : 'kronk-medium',
}

const audioLog = (text, level = 0) => {
	if ( audioSystem.debug === true ) {
		const lastCSS = level === 0 ? 'color: white;' : level === 1 ? 'color: firebrick;' : 'color: lime'
		const now = new Date()
		// eslint-disable-next-line no-console
		console.info(`%c${now.toLocaleTimeString()} %c:: AudioSystem :: %c${text}`, 'color: green; font-weight: bold', 'color: dimgray', lastCSS)
	}
}

const clearLocalVoices = async () => {
	try {
		audioLog('Clearing Local Voice Storage', 1)
		const root = await navigator.storage.getDirectory()
		const dir = await root.getDirectoryHandle('piper') // @ts-ignore
		await dir.remove({ recursive : true })
	} catch (err) {
		audioLog(`Clear Voices Error: ${err.message}`, 1)
	}
}

const listLocalVoices = async () => {
	audioLog('Locally Stored Voices')
	const root = await navigator.storage.getDirectory()
	const dir = await root.getDirectoryHandle('piper', {
		create : true,
	})

	for await (const [name, handle] of dir.entries()) {
		audioLog(`   ${name} - ${handle.kind}`)
	}
}

const getFileHandle = async (dir, path) => {
	try {
		await dir.getFileHandle(path, { create : false })
		audioLog(`   ${path} already exists`)
		return false
	} catch (err) {
		if (err.name === 'NotFoundError') {
			audioLog(`   ${path} needs fetched`, false)
			return dir.getFileHandle(path, { create : true })
		}
		throw err
	}
}

const loadVoices = async () => {
	const voiceFileList = await window.ipc.voiceList()

	const root = await navigator.storage.getDirectory()
	const dir = await root.getDirectoryHandle('piper', {
		create : true,
	})

	/* eslint-disable no-await-in-loop */
	for ( const voiceID of voiceFileList ) {
		audioLog(`Processing ${voiceID}`)
		const onnxPath = `${voiceID}.onnx`
		const jsonPath = `${voiceID}.onnx.json`

		const onnxFile  = await getFileHandle(dir, onnxPath)
		if ( onnxFile !== false ) {
			const onnxWrite = await onnxFile.createWritable()
			const onnxFetch = await fetch(`./voice/${onnxPath}`)
			const onnxBuff  = await onnxFetch.arrayBuffer()
			await onnxWrite.write(onnxBuff)
			await onnxWrite.close()
		}

		const jsonFile  = await getFileHandle(dir, jsonPath)
		if ( jsonFile !== false ) {
			const jsonWrite = await jsonFile.createWritable()
			const jsonFetch = await fetch(`./voice/${jsonPath}`)
			const jsonBuff  = await jsonFetch.arrayBuffer()
			await jsonWrite.write(jsonBuff)
			await jsonWrite.close()
		}
	}
	/* eslint-enable no-await-in-loop */
}

const initSession = () => {
	audioSystem.session = TTSSession(audioSystem.voiceID)
}

document.addEventListener('DOMContentLoaded', async () => {
	const config = await window.ipc.configSync()
	audioSystem.sinkID  = config.settings.audio.sinkID
	audioSystem.voiceID = config.settings.audio.voiceID
	audioSystem.enabled = config.settings.audio.enabled

	audioSystem.chimes = new Audio('inc/chimes.wav')
	audioSystem.chimes.addEventListener('ended', () => {
		audioSystem.speakAudio.play()
	})

	await loadVoices()
	initSession()
	TTSSpeak('Theater Time application has started.')


	setInterval(() => {
		if ( audioSystem.stack.length !== 0 && !audioSystem.blocked ) {
			if ( audioSystem.enabled ) {
				TTSSpeak(audioSystem.stack.shift())
			} else {
				audioSystem.stack.length = 0
			}
		}
	}, 1000)
})

window.ipc.receive('update', (data) => {
	if ( data.spoken ) {
		audioLog(`New utterance queued: "${data.spoken}"`)
		audioSystem.stack.push(data.spoken)
	}
})

window.ipc.receive('config', (data) => {
	audioLog('Configuration data updated', 2)
	audioSystem.sinkID  = data.settings.audio.sinkID
	audioSystem.voiceID = data.settings.audio.voiceID
	audioSystem.enabled = data.settings.audio.enabled
})

const TTSSpeak = (text) => {
	if ( text === '' ) { return }

	audioSystem.blocked = true

	const fixedText = text.replaceAll(/\W&\W/g, ' [[ . ]] ')

	audioSystem.session.predict(fixedText).then((wav) => {
		audioLog(`Utterance running "${fixedText}"`, 2)
		audioSystem.speakAudio = new Audio()
		audioSystem.speakAudio.src = URL.createObjectURL(wav)
		audioSystem.speakAudio.setSinkId(audioSystem.sinkID === null ? '' : audioSystem.sinkID)

		audioSystem.speakAudio.addEventListener('ended', () => {
			audioSystem.blocked = false
		})
		audioSystem.chimes.setSinkId(audioSystem.sinkID === null ? '' : audioSystem.sinkID)
		audioSystem.chimes.play()
	})
}

const TTSSession = (voiceID = 'en_US-hfc_female-medium') => {
	return new tts.TtsSession({
		voiceId : voiceID,

		allowLocalModels : true, // Allow loading local models (default: true)
		fallbackStrategy : 'local', // 'cdn', 'local', or 'auto' (default: 'cdn')

		wasmPaths : {
			onnxWasm : './',
			piperData : './inc/tts/piper_phonemize.data',
			piperWasm : './inc/tts/piper_phonemize.wasm',
		},

		progress : (progress) => {
			// eslint-disable-next-line no-console
			console.log(`Loading: ${Math.round(progress.loaded * 100 / progress.total)}%`)
		},

		logger : (message) => {
			// eslint-disable-next-line no-console
			console.log(`TTS: ${message}`)
		},
	})
}


window.ttsSystem = {
	audioSystem      : audioSystem,
	clearLocalVoices : clearLocalVoices,
	listLocalVoices  : listLocalVoices,
	speak            : TTSSpeak,
}
