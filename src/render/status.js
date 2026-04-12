/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License

	Status
*/

let isInit = false
const audioSystem = {
	blocked : false,
	chimes  : null,
	stack   : [],
	synth   : window.speechSynthesis,
	utter   : new SpeechSynthesisUtterance(),
}

document.addEventListener('DOMContentLoaded', () => {
	audioSystem.utter.rate = 1.2
	audioSystem.utter.pitch = 1.2
	audioSystem.utter.onend = () => { audioSystem.blocked = false }

	for ( const voice of audioSystem.synth.getVoices() ) {
		if ( voice.name.startsWith('Microsoft Mark') ) {
			audioSystem.utter.voice = voice
			audioSystem.utter.rate  = 0.8
			audioSystem.utter.pitch = 0.8
		}
	}

	window.ipc.status()

	audioSystem.chimes = new Audio('inc/chimes.wav')
	audioSystem.chimes.addEventListener('ended', () => {
		audioSystem.utter.text = audioSystem.stack.shift()
		audioSystem.synth.speak(audioSystem.utter)
	})

	setInterval(() => {
		if ( audioSystem.stack.length !== 0 && !audioSystem.blocked ) {
			audioSystem.blocked = true
			audioSystem.chimes.play()
		}
	}, 1000)
})

window.ipc.receive('update', (data) => {
	if ( data.spoken ) { audioSystem.stack.push(data.spoken) }

	if ( !isInit ) { return }
	for ( const timer of data.timers ) {
		UpdateTimer(timer)
	}
})

window.ipc.receive('status', (data) => {
	document.getElementById('status-toggle').innerHTML = data.toggle.flatMap((toggle, index) => StatusSwitch(toggle, index)).join('\n')
	document.getElementById('status-timer').innerHTML  = data.timers.flatMap((timer) => StatusTimer(timer)).join('\n')

	for ( const element of document.querySelectorAll('.toggle-status-card')) {
		element.addEventListener('click', (e) => {
			const index = e.target.closest('.toggle-status-card').getAttribute('data-index')
			window.ipc.toggleSwitch(index)
		})
	}

	isInit = true
})

const TimerItem = (title, value, extra = null, id = null) => {
	return [
		`<div class="d-flex ${extra !== null ? extra : ''}">`,
		`<div class="fw-bold w-25 text-start ps-2">${title}</div>`,
		`<div class="flex-grow-1 text-end pe-2 font-monospace" ${id !== null ? `id="${id}"` : ''}>${value}</div>`,
		'</div>'
	]
}

const ColorTimer = (timer) => {
	switch ( timer.status ) {
		case 1 : {
			if ( timer.wholeSeconds < 0 ) {
				return ['bg-danger-subtle', ['bg-success-subtle', 'bg-primary-subtle']]
			}
			return ['bg-success-subtle', ['bg-danger-subtle', 'bg-primary-subtle']]
		}
		case 2 :
			return ['bg-primary-subtle', ['bg-success-subtle', 'bg-danger-subtle']]
		default :
			return ['', ['bg-success-subtle', 'bg-primary-subtle', 'bg-danger-subtle']]
	}
}

const StatusTimer = (timer) => {
	return [
		`<div class="card mb-2 w-100 timer-status-card ${ColorTimer(timer)[0]}">`,
		`<div class="card-header fw-bold text-center">${timer.title}</div>`,
		'<div class="card-body text-center p-1">',
		...TimerItem(timer.type !== 1 ? 'Remaining' : 'Elapsed', timer.formatTime, 'lead', timer.uuid),
		...(timer.type !== 2 && timer.dateStarted !== null) ? TimerItem('Started', new Date(timer.dateStarted).toLocaleString()) : [],
		...(timer.dateStopped !== null) ? TimerItem('Stopped', new Date(timer.dateStopped).toLocaleString()) : [],
		'</div></div>'
	]
}

const UpdateTimer = (timer) => {
	const color   = ColorTimer(timer)
	const time    = document.getElementById(timer.uuid)
	const contain = time.closest('.timer-status-card')

	time.innerHTML = timer.formatTime
	contain.classList.add(color[0])
	contain.classList.remove(...color[1])
}

const StatusSwitch = (toggle, index) => {
	const color = (toggle.status === 0 && !toggle.reverseColor) || (toggle.status === 1 && toggle.reverseColor) ? 'danger-subtle' : 'success-subtle'
	return [
		`<div class="card mb-2 w-100 toggle-status-card bg-${color}" id="${toggle.id}" data-index="${index}">`,
		`<div class="card-header fw-bold text-center">${toggle.title}</div>`,
		'<div class="card-body text-center p-1 toggleText">',
		toggle.status === 0 ? toggle.textInactive : toggle.textActive,
		'</div></div>'
	]
}