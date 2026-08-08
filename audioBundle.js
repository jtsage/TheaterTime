import * as tts from '@diffusionstudio/vits-web'

tts.flush()

tts.predict({
	text    : 'Text to speech in the browser is amazing!',
	voiceId : 'en_US-hfc_female-medium',
}).then((wav) => {
	const audio = new Audio()
	audio.src = URL.createObjectURL(wav)
	audio.play()
})


