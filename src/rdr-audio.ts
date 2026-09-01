import { DataStackTimerUpdate, TTSaveFile } from './lib/control.js'
import * as tts from '@jtsage/piper-tts-web'

const OVERRIDE_PATH_MAP = {
	'en_US-hfc_female-medium' : 'en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx',
	'en_US-hfc_male-medium'   : 'en/en_US/hfc_male/medium/en_US-hfc_male-medium.onnx',
	'kronk-medium'            : 'en_US-kronk-medium/kronk-medium.onnx',
}

interface AudioSystem {
	blocked    : boolean,
	chimes     : HTMLAudioElement | null,
	debug      : boolean,
	enabled    : boolean,
	session    : unknown,
	sinkID     : string | null,
	speakAudio : HTMLAudioElement | null,
	stack      : string[],
	voiceID    : string
}

const audioSystem : AudioSystem = {
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

const fileCache = new tts.CachedFileReader( {
	customLoader : async( url : string ) => {
		const realFile = url.split( '/' ).at( -1 )
		return fetch( `./${realFile}` ).then( ( response ) => response.blob() )
	},
	pathMap : OVERRIDE_PATH_MAP,
} )

const audioLog = ( text : string, level = 0 ) => {
	if ( audioSystem.debug === true ) {
		const lastCSS = level === 0 ? 'color: white;' : level === 1 ? 'color: firebrick;' : 'color: lime'
		const now = new Date()
		window.ipc.logAudio( text, level )
		// eslint-disable-next-line no-console
		console.info( `%c${now.toLocaleTimeString()} %c:: AudioSystem :: %c${text}`, 'color: green; font-weight: bold', 'color: dimgray', lastCSS )
	}
}

const initSession = () => {
	audioSystem.session = TTSSession( audioSystem.voiceID )
}

// document.addEventListener( 'DOMContentLoaded', async() => {
export const audioStart = async() => {
	const config = await window.ipc.configSync()
	audioSystem.sinkID  = config.settings.audio.sinkID
	audioSystem.voiceID = config.settings.audio.voiceID
	audioSystem.enabled = config.settings.audio.enabled

	audioSystem.chimes = new Audio( './chimes.wav' )
	audioSystem.chimes.addEventListener( 'ended', () => {
		audioSystem.speakAudio!.play()
	} )

	// await loadVoices()
	initSession()
	TTSSpeak( 'Theater Time application has started.' )


	setInterval( () => {
		if ( audioSystem.stack.length !== 0 && !audioSystem.blocked ) {
			if ( audioSystem.enabled ) {
				TTSSpeak( audioSystem.stack.shift() ?? '' )
			} else {
				audioSystem.stack.length = 0
			}
		}
	}, 1000 )
}

export const processUpdate = ( data : DataStackTimerUpdate ) => {
	if ( data.spoken ) {
		audioLog( `New utterance queued: "${data.spoken}"` )
		audioSystem.stack.push( data.spoken )
	}
}

export const updateConfig = ( data : TTSaveFile ) => {
	audioLog( 'Configuration data updated', 2 )
	audioSystem.sinkID  = data.settings.audio.sinkID
	audioSystem.voiceID = data.settings.audio.voiceID
	audioSystem.enabled = data.settings.audio.enabled
}

const TTSSpeak = ( text : string ) => {
	if ( text === '' ) {
		return
	}

	audioSystem.blocked = true

	const fixedText = text.replaceAll( /\W&\W/g, ' [[ . ]] ' )

	// @ts-expect-error unknown types
	audioSystem.session.predict( fixedText ).then( ( wav : Blob ) => {
		audioLog( `Utterance running "${fixedText}"`, 2 )
		audioSystem.speakAudio = new Audio()
		audioSystem.speakAudio.src = URL.createObjectURL( wav )
		audioSystem.speakAudio.setSinkId( audioSystem.sinkID === null ? '' : audioSystem.sinkID )

		audioSystem.speakAudio.addEventListener( 'ended', () => {
			audioSystem.blocked = false
		} )
		audioSystem.chimes!.setSinkId( audioSystem.sinkID === null ? '' : audioSystem.sinkID )
		audioSystem.chimes!.play()
	} )
}

const TTSSession = ( voiceID = 'en_US-hfc_female-medium' ) => {
	return new tts.TtsSession( {
		voiceId : voiceID,

		allowLocalModels : true, // Allow loading local models (default: true)
		fallbackStrategy : 'local', // 'cdn', 'local', or 'auto' (default: 'cdn')

		fileReader : fileCache,

		wasmPaths : {
			piperData : './piper_phonemize.data',
			piperWasm : './piper_phonemize.wasm',
		},

		logger : ( message : string ) => {
			audioLog( `TTS: ${message}` )
		},
	} )
}


// window.ttsSystem = {
// 	audioSystem      : audioSystem,
// 	speak            : TTSSpeak,
// }
