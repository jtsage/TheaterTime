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
		window.ipc.logAudio(text, level)
		// eslint-disable-next-line no-console
		console.info(`%c${now.toLocaleTimeString()} %c:: AudioSystem :: %c${text}`, 'color: green; font-weight: bold', 'color: dimgray', lastCSS)
	}
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

	// await loadVoices()
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
			audioLog(`TTS: ${message}`)
		},
	})
}


window.ttsSystem = {
	audioSystem      : audioSystem,
	speak            : TTSSpeak,
}
