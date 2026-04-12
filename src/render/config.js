/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License

	Configuration Interaction
*/
/* global bootstrap audioSystem */

// MARK: doc load
document.addEventListener('DOMContentLoaded', () => {
	window.ipc.config()

	const saveWarning = new bootstrap.Modal(document.getElementById('save-warning'))

	document.getElementById('click-add-timer').addEventListener('click', () => { clientAddTimer() })
	document.getElementById('click-add-switch').addEventListener('click', () => { clientAddSwitch() })
	document.getElementById('click-save-config').addEventListener('click', () => { clientSaveConfig() })

	for ( const element of document.getElementById('config-tab-pane').querySelectorAll('input') ) {
		element.addEventListener('change', () => { winStatus.dirty = true })
	}
	
	document.getElementById('discard-button').addEventListener('click', () => {
		window.ipc.config()
		saveWarning.hide()
		winStatus.nextTab.show()
		winStatus.nextTab = null
	})

	for (const triggerEl of document.querySelectorAll('#main-tab button')) {
		const tabTrigger = new bootstrap.Tab(triggerEl)

		triggerEl.addEventListener('click', (e) => {
			e.preventDefault()

			clearInterval(window.logInterval)
			winStatus.logInterval = null

			if ( winStatus.dirty ) {
				winStatus.nextTab = tabTrigger
				saveWarning.show()
			} else {
				if ( e.target.id === 'log-tab' ) {
					winStatus.logInterval = setInterval(() => {
						window.ipc.updateLog()
					}, 1000)
				}
				tabTrigger.show()
			}
		})
	}
})

window.ipc.receive('view', (id) => {
	document.getElementById(id).click()
})

const winStatus = {
	dirty       : true,
	logInterval : null,
	nextTab     : null,
	switchList  : [],
	timerCount  : 0,
}

const TimerType = Object.freeze({
	0 : '!!Invalid!!',
	1 : 'Count Up',
	2 : 'Count Down to DateTime',
	3 : 'Count Down to # of Minutes',
})

// MARK: config receive
window.ipc.receive('config', (data) => {
	updateConfig(data.settings)
	winStatus.dirty      = false
	winStatus.timerCount = data.timers.length
	winStatus.switchList = data.toggle.map((toggle) => [toggle.id, toggle.title])

	const switchConfig = document.getElementById('toggle-config')
	switchConfig.innerHTML = data.toggle.map((toggle, index) => SwitchConfigHTML(toggle, index)).join('\n')

	const timerConfig = document.getElementById('timer-config')
	timerConfig.innerHTML = data.timers.map((timer, index) => TimerConfigHTML(timer, index)).join('\n')
	timer_details()

	for (const element of document.querySelectorAll('#timer-config select, #timer-config input, #toggle-config input, #toggle-config select')) {
		element.addEventListener('change', (e) => {
			timer_details()
			mark_item(e)
		})
	}

	for (const element of document.querySelectorAll('.action-btn')) {
		switch (element.getAttribute('data-action')) {
			case 'reload' :
				element.addEventListener('click', () => { window.ipc.config() })
				break
			case 'remove-timer' :
				element.addEventListener('click', (e) => remove_item(e, 'timer'))
				break
			case 'remove-switch' :
				element.addEventListener('click', (e) => remove_item(e, 'switch'))
				break
			case 'save-timer' :
				element.addEventListener('click', () => save_item(true))
				break
			case 'save-switch' :
				element.addEventListener('click', () => save_item(false))
				break
			default :
				break
		}
	}
	document.getElementById('click-add-switch').classList.remove('d-none')
	document.getElementById('click-add-timer').classList.remove('d-none')
})

// MARK: save_item
const save_item = (timers = true) => {
	const container = document.getElementById(timers ? 'timer-config' : 'toggle-config')
	const saveData  = []

	for (const form of container.getElementsByTagName('form')) {
		const formData = new FormData(form)
		const jsonData = { reset_switches : [] }

		for (const pair of formData.entries()) {
			if ( pair[0].substring(0, 16) === 'reset_switches--') {
				jsonData.reset_switches.push(pair[1])
			} else if ( pair[0] === 'type' ) {
				jsonData.type = parseInt(pair[1], 10)
			} else if ( pair[1] === 'true' || pair[1] === 'false') {
				jsonData[pair[0]] = pair[1] === 'true'
			} else {
				jsonData[pair[0]] = pair[1]
			}
			switch (jsonData?.type) {
				case 1 :
					jsonData.minutes = null
					jsonData.target = null
					break
				case 2 :
					jsonData.minutes = null
					break
				case 3 :
					jsonData.target = null
					jsonData.minutes = parseInt(jsonData.minutes, 10)
					break
				default :
					break
			}
		}
		saveData.push(jsonData)
	}

	if ( timers ) {
		window.ipc.saveTimer(saveData)
	} else {
		window.ipc.saveSwitch(saveData)
	}
}

// MARK: remove_item
const remove_item = (e, type = 'switch') => {
	const button = e.target.tagName === 'button' ? e.target : e.target.closest('button')
	const index  = button.getAttribute('data-index')
	if ( index !== null ) {
		switch ( type ) {
			case 'switch' :
				window.ipc.removeSwitch(index)
				break
			case 'timer' :
				window.ipc.removeTimer(index)
				break
			default : break
		}
		
	}
}

// MARK: mark_item
const mark_item = (e) => {
	winStatus.dirty = true
	const card = e.target.closest('div.card')
	card.classList.add('bg-primary-subtle')

	const container = card.parentElement
	for (const element of container.querySelectorAll('.action-btn[data-action="reload"], .action-btn[data-action^="save-"]')) {
		element.classList.remove('d-none')
	}
}

// MARK: timer_details
const timer_details = () => {
	for (const card of document.querySelectorAll('.timer-card')) {
		switch (card.querySelector('select[name="type"]').value) {
			case '1' : //count-up
				card.querySelector('input[name="minutes"]').parentElement.classList.add('d-none')
				card.querySelector('input[name="target"]').parentElement.classList.add('d-none')
				card.querySelector('.select-resets').classList.remove('d-none')
				card.querySelector('.toggle-sound_countdowns').classList.add('d-none')
				break
			case '2' : //count-down
				card.querySelector('input[name="minutes"]').parentElement.classList.add('d-none')
				card.querySelector('input[name="target"]').parentElement.classList.remove('d-none')
				card.querySelector('.select-resets').classList.add('d-none')
				card.querySelector('.toggle-sound_countdowns').classList.remove('d-none')
				break
			case '3' : //count-minutes
				card.querySelector('input[name="minutes"]').parentElement.classList.remove('d-none')
				card.querySelector('input[name="target"]').parentElement.classList.add('d-none')
				card.querySelector('.select-resets').classList.remove('d-none')
				card.querySelector('.toggle-sound_countdowns').classList.remove('d-none')
				break
			default :
				break
		}
	}
}

const timer_date_time = (date) => {
	const dateObj = date !== null ? new Date(date) : new Date()
	return `${dateObj.getFullYear()}-${(dateObj.getMonth()+1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}T${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`
}

// MARK: timer HTML
const TimerConfigHTML = (timer, index, create = false) => {
	return [
		'<div class="card mb-2 timer-card">',
		'<div class="card-header d-flex">',
		`<div class="fw-bold">Timer #${index+1}</div><div class="me-0 ms-auto">`,
		...HTMLButtons('timer', index, create, true),
		'</div></div>',
		'<div class="card-body p-1"><form>',

		...HTMLFormText( 'title', timer.title, 'Title'),
		...HTMLTimerType(timer.type),
		...HTMLToggleButton(
			'sound_countdowns',
			'Sound',
			timer.sound_countdowns,
			'Play sounds for 90, 60, 30, 20, 15, 10, &amp; 5 minutes remain',
			{
				falseColor : 'primary',
				falseText  : 'Disabled',
				trueColor  : 'success',
				trueText   : 'Enabled',
			}
		),

		'<div class="input-group mb-1">',
		'<span title="Title of timer" class="input-group-text w-25">Minutes</span>',
		`<input type="number" step="1" min="1" max="60" class="form-control text-end" name="minutes" value="${timer.minutes !== null ? timer.minutes : 10}">`,
		'</div>',
		
		'<div class="input-group mb-1">',
		'<span title="Title of timer" class="input-group-text w-25">Target</span>',
		`<input type="datetime-local" class="form-control text-end" name="target" value="${timer_date_time(timer.target)}">`,
		'</div>',

		...HTMLSelectResets(timer.reset_switches),

		'</form></div>',
		'</div>'
	].join('\n')
}

// MARK: switch HTML
const SwitchConfigHTML = (toggle, index, create = false) => {
	return [
		`<div class="card mb-2" data-index="${index}">`,
		'<div class="card-header d-flex">',
		`<div class="fw-bold">Switch #${index+1}</div><div class="me-0 ms-auto">`,
		...HTMLButtons('switch', index, create, false),
		'</div></div>',
		'<div class="card-body p-1"><form>',

		...HTMLFormText( 'title', toggle.title, 'Title'),
		...HTMLFormText( 'textActive', toggle.textActive, 'Active Text'),
		...HTMLFormText( 'textInactive', toggle.textInactive, 'Inactive Text'),
		...HTMLFormText( 'speak', toggle.speak, 'Speak'),

		...HTMLToggleButton(
			'reverseColor',
			'Color',
			toggle.reverseColor,
			null,
			{
				falseColor : 'primary',
				falseText  : 'Standard',
				trueColor  : 'danger',
				trueText   : 'Reversed',
			}
		),
		...HTMLSelectResets(toggle.reset_switches, toggle.id),

		'</form></div></div>'
	].join('\n')
}

// MARK: other HTML
const HTMLButtons = (type, index, create = false, no_delete_first = true) => {
	return [
		`<button data-action="save-${type}" title="Save ALL Changes" class="btn btn-sm btn-success action-btn ${!create ? 'd-none':''}" type="button"><i class="bi bi-floppy2"></i></button>`,
		`<button data-action="reload" title="Discard ALL Changes" class="btn btn-sm btn-primary action-btn ${!create ? 'd-none':''}" type="button"><i class="bi bi-arrow-clockwise"></i></button>`,
		`<button data-action="remove-${type}" title="Remove Item" data-index="${index}" class="btn btn-sm btn-danger action-btn ${create || (index === 0 && no_delete_first) ? 'd-none':''}" type="button"><i class="bi bi-trash3-fill"></i></button>`,
	]
}

const HTMLFormText = (name, value, title, desc = null) => {
	return [
		'<div class="input-group mb-1">',
		`<span title="${desc !== null ? desc : title}" class="input-group-text w-25">${title}</span>`,
		`<input type="text" class="form-control" name="${name}" value="${value}">`,
		'</div>',
	]
}

const HTMLTimerType = (type) => {
	return [
		'<div class="input-group mb-1">',
		'<span title="Type of timer" class="input-group-text w-25">Type</span>',
		'<select name="type" class="form-select">',
		...[1, 2, 3].map((i) => {
			return `<option value="${i}" ${i === type ? 'selected' : ''}>${TimerType[i]}</option>`
		}),
		'</select></div>'
	]
}

const HTMLToggleButton = (name, title, value, desc = null, {trueColor = 'success', trueText = 'ON', falseColor = 'danger', falseText = 'OFF'} = {}) => {
	const id_1 = crypto.randomUUID()
	const id_2 = crypto.randomUUID()
	return [
		`<div class="input-group mb-1 toggle-${name}">`,
		`<span title="${desc !== null ? desc : title}" class="input-group-text w-25">${title}</span><div class="btn-group w-75">`,
		`<input type="radio" class="btn-check" name="${name}" value="true" id="${id_1}" autocomplete="off" ${value ? 'checked' : ''}>`,
		`<label class="btn btn-outline-${trueColor} rounded-0" for="${id_1}">${trueText}</label>`,

		`<input type="radio" class="btn-check" name="${name}" value="false" id="${id_2}" autocomplete="off" ${!value ? 'checked' : ''}>`,
		`<label class="btn btn-outline-${falseColor}" for="${id_2}">${falseText}</label>`,
		'</div></div>',
	]
}

const HTMLSelectResets = (selected, skip = null) => {
	const selects = Array.isArray(selected) ? selected : []
	return [
		'<div class="input-group mb-1 select-resets">',
		'<span title="Reset switches on start" class="input-group-text w-25">Reset Switch(es)</span>',
		'<div class="form-control">',
		...winStatus.switchList.flatMap((element) => {
			if ( skip === element[0] ) { return [] }
			let isSelected = false
			for ( const check of selects ) {
				if ( check === element[0] ) { isSelected = true }
			}
			return [
				`<div><input name="reset_switches--${element[0]}" class="form-check-input" type="checkbox" value="${element[0]}" ${isSelected ? 'checked' : ''}>`,
				`<label class="form-check-label" for="checkDefault">${element[1]}</label></div>`
			]
		}),
		'</div></div>'
	]
}

// MARK: general set
const updateConfig = (settings) => {
	document.getElementById('send-host').value = settings.send.host
	document.getElementById('send-port').value = settings.send.port
	document.getElementById('send-switch').checked = settings.send.switch
	document.getElementById('send-toggle').checked = settings.send.toggle
	document.getElementById('send-active').checked = settings.send.active
	document.getElementById('send-blink').checked  = settings.send.blink
	document.getElementById('receive-port').value = settings.receive.port
	document.getElementById('config-audio').checked = settings.audio
	audioSystem.enabled = settings.audio
}

function clientSaveConfig() {
	winStatus.dirty = false
	const settings = {
		audio : document.getElementById('config-audio').checked,
		send : {
			active : document.getElementById('send-active').checked,
			blink  : document.getElementById('send-blink').checked,
			host   : document.getElementById('send-host').value,
			port   : document.getElementById('send-port').value,
			switch : document.getElementById('send-switch').checked,
			toggle : document.getElementById('send-toggle').checked,
		},
		receive : {
			port : document.getElementById('receive-port').value,
		},
	}
	window.ipc.saveSettings(settings)
}


// MARK: client buttons
function clientAddSwitch() {
	document.getElementById('click-add-switch').classList.add('d-none')
	const thisSwitch = document.createElement('div')
	thisSwitch.innerHTML = SwitchConfigHTML({
		reset_switches : null,
		reverseColor   : false,
		speak          : '',
		textActive     : 'ON',
		textInactive   : 'OFF',
		title          : '',
	}, winStatus.switchList.length, true)
	thisSwitch.querySelector('.action-btn[data-action="save-switch"]').addEventListener('click', () => save_item(false))
	thisSwitch.querySelector('.action-btn[data-action="reload"]').addEventListener('click', () => { window.ipc.config() })
	
	document.getElementById('toggle-config').append(thisSwitch)
}

function clientAddTimer() {
	document.getElementById('click-add-timer').classList.add('d-none')
	const thisTimer = document.createElement('div')
	thisTimer.innerHTML = TimerConfigHTML({
		minutes          : null,
		reset_switches   : null,
		sound_countdowns : false,
		target           : new Date(),
		title            : '',
		type             : 2,
	}, winStatus.timerCount, true)
	thisTimer.querySelector('.action-btn[data-action="save-timer"]').addEventListener('click', () => save_item(false))
	thisTimer.querySelector('.action-btn[data-action="reload"]').addEventListener('click', () => { window.ipc.config() })
	
	thisTimer.querySelector('.card').classList.add('bg-primary-subtle')

	for (const element of thisTimer.querySelectorAll('select')) {
		element.addEventListener('change', () => { timer_details() })
	}

	document.getElementById('timer-config').append(thisTimer)
	timer_details()
}
