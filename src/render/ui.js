/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License
*/

document.addEventListener('DOMContentLoaded', () => {
	window.ipc.config()
})

const switchList = []

// const TimerStatus = Object.freeze({
// 	0 : 'Pending',
// 	1 : 'Running',
// 	2 : 'Finished',
// })

const TimerType = Object.freeze({
	0 : '!!Invalid!!',
	1 : 'Count Up',
	2 : 'Count Down to DateTime',
	3 : 'Count Down to # of Minutes',
})

// const SwitchStatus = Object.freeze({
// 	0 : 'Inactive',
// 	1 : 'Active',
// })

window.ipc.receive('config', (data) => {
	console.log(data)
	switchList.length = 0
	for ( const toggle of data.toggle ) {
		switchList.push([toggle.id, toggle.title])
	}

	const switchConfig = document.getElementById('toggle-config')
	switchConfig.innerHTML = data.toggle.map((toggle, index) => SwitchConfigHTML(toggle, index)).join('\n')

	const timerConfig = document.getElementById('timer-config')
	timerConfig.innerHTML = data.timers.map((timer, index) => TimerConfigHTML(timer, index)).join('\n')

	for (const element of switchConfig.getElementsByTagName('select')) {
		element.addEventListener('change', (e) => switch_change(e))
	}
	for (const element of switchConfig.getElementsByTagName('input')) {
		element.addEventListener('change', (e) => switch_change(e))
	}
	for (const element of switchConfig.querySelectorAll('.save-switch')) {
		element.addEventListener('click', () => switch_save())
	}
	for (const element of switchConfig.querySelectorAll('.reload-switch')) {
		element.addEventListener('click', () => { window.ipc.config() })
	}
	for (const element of switchConfig.querySelectorAll('.remove-switch')) {
		element.addEventListener('click', (e) => switch_delete(e))
	}

	for (const element of timerConfig.getElementsByTagName('select')) {
		element.addEventListener('change', (e) => timer_change(e))
	}
	for (const element of timerConfig.getElementsByTagName('input')) {
		element.addEventListener('change', (e) => timer_change(e))
	}
	for (const element of switchConfig.querySelectorAll('.save-timer')) {
		element.addEventListener('click', () => timer_save())
	}
	for (const element of switchConfig.querySelectorAll('.reload-timer')) {
		element.addEventListener('click', () => { window.ipc.config() })
	}
	for (const element of switchConfig.querySelectorAll('.remove-timer')) {
		element.addEventListener('click', (e) => timer_delete(e))
	}
})

const switch_save = () => {
	const toggles = document.getElementById('toggle-config')
	const saveData = []
	for (const form of toggles.getElementsByTagName('form')) {
		const formData = new FormData(form)
		const jsonData = { reset_switches : [] }
		for (const pair of formData.entries()) {
			if ( pair[0].substring(0, 16) === 'reset_switches--') {
				jsonData.reset_switches.push(pair[1])
			} else if ( pair[0] === 'reverseColor' ) {
				jsonData.reverseColor = pair[1] === 'true'
			} else {
				jsonData[pair[0]] = pair[1]
			}
		}
		saveData.push(jsonData)
	}
	window.ipc.saveSwitch(saveData)
}

const switch_delete = (e) => {
	const button = e.target.tagName === 'button' ? e.target : e.target.closest('button')
	const index  = button.getAttribute('data-index')
	if ( index !== null ) {
		window.ipc.removeSwitch(button.getAttribute('data-index'))
	}
}

const switch_change = (e) => {
	const card = e.target.closest('div.card')
	card.classList.add('bg-primary-subtle')

	const toggles = document.getElementById('toggle-config')
	for (const element of toggles.querySelectorAll('.save-switch, .reload-switch')) {
		element.classList.remove('d-none')
	}
}

const timer_change = (e) => {
	const card = e.target.closest('div.card')
	card.classList.add('bg-primary-subtle')

	const toggles = document.getElementById('timer-config')
	for (const element of toggles.querySelectorAll('.save-timer, .reload-timer')) {
		element.classList.remove('d-none')
	}
}



const timer_date_time = (date) => {
	const dateObj = date !== null ? new Date(date) : new Date()
	return `${dateObj.getFullYear()}-${(dateObj.getMonth()+1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}T${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`
}

const TimerConfigHTML = (timer, index, create = false) => {
	return [
		'<div class="card mb-2">',
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
			'Play sounds for 30, 20, 15, 10, &amp; 5 minutes remain',
			{
				falseColor : 'primary',
				falseText  : 'Disabled',
				trueColor  : 'success',
				trueText   : 'Enabled',
			}
		),

		'<div class="input-group mb-1">',
		'<span title="Title of timer" class="input-group-text w-25">Minutes</span>',
		`<input type="number" step="1" min="1" max="60" class="form-control text-end" name="targetMinutes" value="${timer.targetMinutes !== null ? timer.targetMinutes : 10}">`,
		'</div>',
		
		'<div class="input-group mb-1">',
		'<span title="Title of timer" class="input-group-text w-25">Target</span>',
		`<input type="datetime-local" class="form-control text-end" name="targetDateTime" value="${timer_date_time(timer.targetDateTime)}">`,
		'</div>',

		...HTMLSelectResets(timer.reset_switches),

		'</form></div>',
		'</div>'
	].join('\n')
}

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
		...HTMLFormText( 'audioFile', toggle.audioFile, 'Audio File', 'Audio to play when toggled active'),

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
		...HTMLSelectResets(toggle.reset_switches),

		'</form></div></div>'
	].join('\n')
}

const HTMLButtons = (type, index, create = false, no_delete_first = true) => {
	return [
		`<button title="Save ALL Changes" class="btn btn-sm btn-success save-${type} ${!create ? 'd-none':''}" type="button"><i class="bi bi-floppy2"></i></button>`,
		`<button title="Discard ALL Changes" class="btn btn-sm btn-primary reload-${type} ${!create ? 'd-none':''}" type="button"><i class="bi bi-arrow-clockwise"></i></button>`,
		`<button title="Remove Item" data-index="${index}" class="btn btn-sm btn-danger remove-${type} ${create || (index === 0 && no_delete_first) ? 'd-none':''}" type="button"><i class="bi bi-trash3-fill"></i></button>`,
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
		'<div class="input-group mb-1">',
		`<span title="${desc !== null ? desc : title}" class="input-group-text w-25">${title}</span><div class="btn-group w-75">`,
		`<input type="radio" class="btn-check" name="${name}" value="true" id="${id_1}" autocomplete="off" ${value ? 'checked' : ''}>`,
		`<label class="btn btn-outline-${trueColor} rounded-0" for="${id_1}">${trueText}</label>`,

		`<input type="radio" class="btn-check" name="${name}" value="false" id="${id_2}" autocomplete="off" ${!value ? 'checked' : ''}>`,
		`<label class="btn btn-outline-${falseColor}" for="${id_2}">${falseText}</label>`,
		'</div></div>',
	]
}

const HTMLSelectResets = (selected) => {
	const selects = Array.isArray(selected) ? selected : []
	return [
		'<div class="input-group mb-1">',
		'<span title="Reset switches on start" class="input-group-text w-25">Reset Switch(es)</span>',
		'<div class="form-control">',
		...switchList.flatMap((element) => {
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


function clientAddSwitch() {
	const thisSwitch = document.createElement('div')
	thisSwitch.innerHTML = SwitchConfigHTML({
		audioFile      : '',
		reset_switches : null,
		reverseColor   : false,
		textActive     : 'ON',
		textInactive   : 'OFF',
		title          : '',
	}, switchList.length, true)
	thisSwitch.querySelector('.save-switch').addEventListener('click', () => switch_save())
	thisSwitch.querySelector('.reload-switch').addEventListener('click', () => { window.ipc.config() })
	
	document.getElementById('toggle-config').append(thisSwitch)
}