import * as tts from './inc/vits-web.js'

const wav = await tts.predict({
	text : 'Text to speech in the browser is amazing!',
	voiceId : 'en_US-hfc_female-medium',
})

const audio = new Audio()
audio.src = URL.createObjectURL(wav)
audio.play()