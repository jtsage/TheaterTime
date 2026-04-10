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

const TimerStatus = Object.freeze({
	0 : 'Pending',
	1 : 'Running',
	2 : 'Finished',
})

const TimerType = Object.freeze({
	0 : '!!Invalid!!',
	1 : 'Count Up',
	2 : 'Count Down to DateTime',
	3 : 'Count Down to # of Minutes',
})

const SwitchStatus = Object.freeze({
	0 : 'Inactive',
	1 : 'Active',
})

window.ipc.receive('config', (data) => {
	switchList.length = 0
	for ( const toggle of data.toggle ) {
		switchList.push([toggle.id, toggle.title])
	}

	const switchConfig = document.getElementById('toggle-config')
	switchConfig.innerHTML = data.toggle.map((toggle, index) => SwitchConfigHTML(toggle, index)).join('\n')

	const timerConfig = document.getElementById('timer-config')
	timerConfig.innerHTML = data.timers.map((timer, index) => TimerConfigHTML(timer, index)).join('\n')
})

const timer_type_select = (type) => {
	const output = ['<select name="type" class="form-select">']
	for ( let i = 1; i<=3; i++ ) {
		output.push(`<option value="${i}" ${i === type ? 'selected' : ''}>${TimerType[i]}</option>`)
	}
	output.push('</select>')
	return output
}

const switch_reset_select = (selected) => {
	const selects = Array.isArray(selected) ? selected : []
	const output = ['<select name="reset_switches" multiple class="form-select">']
	for ( const element of switchList ) {
		let isSelected = false
		for ( const check of selects ) {
			if ( check === element[0] ) { isSelected = true }
		}
		output.push(`<option value="${element[0]}" ${isSelected ? 'selected' : ''}>${element[1]}</option>`)
	}
	output.push('</select>')
	return output
}


const timer_date_time = (date) => {
	const dateObj = date !== null ? new Date(date) : new Date()
	return `${dateObj.getFullYear()}-${(dateObj.getMonth()+1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}T${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`
}

const TimerConfigHTML = (timer, index) => {
	return [
		'<div class="card mb-2">',
		'<div class="card-header">',
		`<div class="fw-bold">Timer #${index+1}</div>`,
		'</div>',
		'<div class="card-body p-1"><form>',

		'<div class="input-group mb-1">',
		'<span title="Title of timer" class="input-group-text w-25">Title</span>',
		`<input type="text" class="form-control" name="title" value="${timer.title}">`,
		'</div>',

		'<div class="input-group mb-1">',
		'<span title="Type of timer" class="input-group-text w-25">Type</span>',
		...timer_type_select(timer.type),
		'</div>',

		'<div class="input-group mb-1">',
		'<span title="Play sounds for 30, 20, 15, 10, &amp; 5 minutes remain" class="input-group-text w-25">Sound</span><div class="btn-group w-75">',
		`<input type="radio" class="btn-check" name="options-outlined" id="success-outlined" autocomplete="off" ${timer.sound_countdowns ? 'checked' : ''}>`,
		'<label class="btn btn-outline-success rounded-0" for="success-outlined">Enabled</label>',

		`<input type="radio" class="btn-check" name="options-outlined" id="danger-outlined" autocomplete="off" ${!timer.sound_countdowns ? 'checked' : ''}>`,
		'<label class="btn btn-outline-danger" for="danger-outlined">Disabled</label>',
		'</div></div>',

		'<div class="input-group mb-1">',
		'<span title="Title of timer" class="input-group-text w-25">Minutes</span>',
		`<input type="number" step="1" min="1" max="60" class="form-control text-end" name="targetMinutes" value="${timer.targetMinutes !== null ? timer.targetMinutes : 10}">`,
		'</div>',
		
		'<div class="input-group mb-1">',
		'<span title="Title of timer" class="input-group-text w-25">Target</span>',
		`<input type="datetime-local" class="form-control text-end" name="targetDateTime" value="${timer_date_time(timer.targetDateTime)}">`,
		'</div>',

		'<div class="input-group mb-1">',
		'<span title="Reset switches on start" class="input-group-text w-25">Reset Switch</span>',
		...switch_reset_select(timer.reset_switches),
		'</div>',

		'</form></div>',
		'</div>'
	].join('\n')
}


const SwitchConfigHTML = (toggle, index) => {
	return [
		'<div class="card mb-2">',
		'<div class="card-header">',
		`<div class="fw-bold">Switch #${index+1}</div>`,
		'</div>',
		'<div class="card-body p-1"><form>',

		'<div class="input-group mb-1">',
		'<span title="Title of timer" class="input-group-text w-25">Title</span>',
		`<input type="text" class="form-control" name="title" value="${toggle.title}">`,
		'</div>',

		'<div class="input-group mb-1">',
		'<span title="Active Text" class="input-group-text w-25">Active Text</span>',
		`<input type="text" class="form-control" name="textActive" value="${toggle.textActive}">`,
		'</div>',

		'<div class="input-group mb-1">',
		'<span title="Inactive Text" class="input-group-text w-25">Inactive Text</span>',
		`<input type="text" class="form-control" name="textInactive" value="${toggle.textInactive}">`,
		'</div>',

		'<div class="input-group mb-1">',
		'<span title="Audio to play when switched on" class="input-group-text w-25">Audio File</span>',
		`<input type="text" class="form-control" name="title" value="${toggle.audioFile}">`,
		'</div>',

		'<div class="input-group mb-1">',
		'<span title="Reverse color" class="input-group-text w-25">Color</span><div class="btn-group w-75">',
		`<input type="radio" class="btn-check" name="options-outlined" id="danger-outlined" autocomplete="off" ${toggle.reverseColor ? 'checked' : ''}>`,
		'<label class="btn btn-outline-danger rounded-0" for="danger-outlined">Reversed</label>',

		`<input type="radio" class="btn-check" name="options-outlined" id="success-outlined" autocomplete="off" ${!toggle.reverseColor ? 'checked' : ''}>`,
		'<label class="btn btn-outline-success" for="success-outlined">Standard</label>',
		'</div></div>',

		'<div class="input-group mb-1">',
		'<span title="Reset switches on start" class="input-group-text w-25">Reset Switch</span>',
		...switch_reset_select(toggle.reset_switches),
		'</div>',

		'</form></div>',
		'</div>'
	].join('\n')
}