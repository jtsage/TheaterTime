/*  ___  _               _            ___  _
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2023 J.T.Sage - ISC License
*/
/* eslint-disable unicorn/no-unused-properties */
/* global bootstrap */

const byID      = (elementID) => document.getElementById(elementID)
let eventData   = {}

const buildSwitch = (idx, switchData) => {
	return `<div class="col">
		<div class="card text-bg-light">
			<div class="card-header">Public Switch #${idx+1}
				<div class="float-end">
					${ idx > 0 ? `<div class="btn btn-sm btn-secondary" title="Move Up" onclick="clientMoveSwitch(${idx}, 1)"><i class="bi bi-caret-up-square"></i></div>` : '' }
					${ idx < eventData.clientData.switches.length -1 ? `<div class="btn btn-sm btn-secondary" title="Move Down" onclick="clientMoveSwitch(${idx}, -1)"><i class="bi bi-caret-down-square"></i></div>` : '' }
					<div class="btn btn-sm btn-info" title="Edit" onclick="clientEditSwitch(${idx})"><i class="bi bi-pencil-square"></i></div>
					<div class="btn btn-sm btn-danger" title="Delete" onclick="clientDeleteSwitch(${idx})"><i class="bi bi-trash3"></i></div>
				</div>
			</div>
			<ul class="list-group list-group-flush">
				<li class="list-group-item list-group-item-light"><strong>ID</strong> : ${switchData.id}</li>
				<li class="list-group-item list-group-item-light"><strong>Name</strong> : ${switchData.name}</li>
				<li class="list-group-item list-group-item-light"><strong>Green Text</strong> : ${switchData.switch_on}</li>
				<li class="list-group-item list-group-item-light"><strong>Red Text</strong> : ${switchData.switch_off}</li>
				<li class="list-group-item list-group-item-light"><strong>Initial State</strong> : ${switchData.status ? 'GREEN' : 'RED'}</li>
			</ul>
		</div>
	</div>`
}

const buildTimer = (idx, timerData) => {
	let timerType = ''

	if ( timerData.is_down && timerData.min_to_count !== null ) {
		timerType = 'Countdown # Of Minutes'
	} else if ( timerData.is_down ) {
		timerType = 'Countdown to Time'
	} else {
		timerType = 'Stopwatch'
	}

	const extraItemsHTML = []
	extraItemsHTML.push('<ul class="list-group list-group-flush">')

	if ( typeof timerData.items === 'object' ) {
		for ( const [itemIDX, itemData] of timerData.items.entries() ) {
			extraItemsHTML.push(`<li class="list-group-item list-group-item-light"><div class="row">
				<div class="col-9">
					<strong>Time</strong> : ${itemData.time}<br />
					<strong>Text</strong> : ${itemData.name}
				</div>
				<div class="col-3 text-center">
					<div class="btn btn-sm btn-danger" title="Delete" onclick="clientDeleteTimerItem(${idx}, ${itemIDX})"><i class="bi bi-trash3"></i></div>
				</div>
			</li>`)
		}
	}
	extraItemsHTML.push(`<li class="list-group-item list-group-item-light"><div class="row">
		<div class="col-9"></div>
		<div class="col-3 text-center">
			<div class="btn btn-sm btn-success" title="Add New" onclick="clientAddTimerItem(${idx})"><i class="bi bi-plus-circle"></i></div>
		</div>
	</li></ul>`)

	return `<div class="col">
		<div class="card text-bg-light">
			<div class="card-header">Timer #${idx+1}
				<div class="float-end">
					${ idx > 0 ? `<div class="btn btn-sm btn-secondary" title="Move Up" onclick="clientMoveTimer(${idx}, 1)"><i class="bi bi-caret-up-square"></i></div>` : '' }
					${ idx < eventData.clientData.timers.length -1 ? `<div class="btn btn-sm btn-secondary" title="Move Down" onclick="clientMoveTimer(${idx}, -1)"><i class="bi bi-caret-down-square"></i></div>` : '' }
					<div class="btn btn-sm btn-info" title="Edit" onclick="clientEditTimer(${idx})"><i class="bi bi-pencil-square"></i></div>
					<div class="btn btn-sm btn-danger" title="Delete" onclick="clientDeleteTimer(${idx})"><i class="bi bi-trash3"></i></div>
				</div>
			</div>
			<ul class="list-group list-group-flush">
				<li class="list-group-item list-group-item-light"><strong>ID</strong> : ${timerData.id}</li>
				<li class="list-group-item list-group-item-light"><strong>Name</strong> : ${timerData.name}</li>
				<li class="list-group-item list-group-item-light"><strong>Type</strong> : ${timerType}</li>
				<li class="list-group-item list-group-item-light"><strong>End Time</strong> : ${timerData.is_down && timerData.time_to_end !== null ? new Date(timerData.time_to_end).toLocaleString() : '<em>n/a</em>' }</li>
				<li class="list-group-item list-group-item-light"><strong>Minutes to Count</strong> : ${timerData.is_down && timerData.min_to_count !== null ? timerData.min_to_count : '<em>n/a</em>'}</li>
				<li class="list-group-item list-group-item-light"><strong>Reset Places Switch</strong> : ${timerData.reset_places ? 'YES' : 'no'}</li>
			</ul>
			<div class="text-bg-info text-white p-2 text-center"><strong>Extra Items</strong></div>
			${extraItemsHTML.length !== 0 ? extraItemsHTML.join('') : '' }
		</div>
	</div>`
}

const clientEditTimer = (idx) => {}
const clientDoTimerEdit = () => {}
const clientDeleteTimer = (idx) => {}
const clientDoTimerDelete = () => {}
const clientMoveTimer = (idx, direction) => {}
const clientDeleteTimerItem = (timerIDX, itemIDX) => {}
const clientDoTimerItemDelete = () => {}
const clientAddTimerItem = (timerIDX) => {}
const clientDoTimerItemAdd = () => {}

const clientDoText = (name) => {
	switch ( name ) {
		case 'info_subtitle' :
			eventData.clientData.info.subtitle = byID('info_subtitle').value
			break
		case 'info_title':
			eventData.clientData.info.title = byID('info_title').value
			break
		case 'internal_password' :
			eventData.internals.adminPass = byID('internal_password').value
			break
		default:
			break
	}
}

const clientMoveSwitch = (idx, direction) => {
	const from = idx
	const to   = direction < 0 ? idx + 1 : idx -1
	eventData.clientData.switches.splice(to, 0, eventData.clientData.switches.splice(from, 1)[0])
	fillFormData()
}

const clientDeleteSwitch = (idx) => {
	byID('switch_delete_idx').value = idx
	switchModalDelete.show()
}

const clientDoSwitchDelete = () => {
	const switchIDX = byID('switch_delete_idx').value
	if ( switchIDX > -1 ) { eventData.clientData.switches.splice(switchIDX, 1) }
	switchModalDelete.hide()
	fillFormData()
}

const clientEditSwitch = (idx) => {
	byID('switch_idx').value        = idx
	byID('switch_id').value         = idx === -1 ? ''    : eventData.clientData.switches[idx].id
	byID('switch_name').value       = idx === -1 ? ''    : eventData.clientData.switches[idx].name
	byID('switch_status').checked   = idx === -1 ? false : eventData.clientData.switches[idx].status
	byID('switch_switch_off').value = idx === -1 ? ''    : eventData.clientData.switches[idx].switch_off
	byID('switch_switch_on').value  = idx === -1 ? ''    : eventData.clientData.switches[idx].switch_on
	if ( switchModal !== null ) { switchModal.show() }
}

const clientDoSwitchModal = () => {
	const switchIDX = byID('switch_idx').value

	if ( switchIDX > -1 ) {
		eventData.clientData.switches[switchIDX].id         = byID('switch_id').value
		eventData.clientData.switches[switchIDX].name       = byID('switch_name').value
		eventData.clientData.switches[switchIDX].status     = byID('switch_status').checked
		eventData.clientData.switches[switchIDX].switch_off = byID('switch_switch_off').value
		eventData.clientData.switches[switchIDX].switch_on  = byID('switch_switch_on').value
	} else {
		let proposedID = byID('switch_id').value
		for ( const switchData of eventData.clientData.switches ) {
			if (switchData.id === proposedID) {
				proposedID = `${proposedID}_${eventData.clientData.switches.length}`
			}
		}
		eventData.clientData.switches.push({
			id         : proposedID,
			name       : byID('switch_name').value,
			status     : byID('switch_status').checked,
			switch_off : byID('switch_switch_off').value,
			switch_on  : byID('switch_switch_on').value,
		})
	}
	switchModal.hide()
	fillFormData()
}

const fillFormData = () => {
	byID('internal_ip').value = eventData.internals.ipAddress
	byID('internal_password').value = eventData.internals.adminPass
	byID('info_subtitle').value = eventData.clientData.info.subtitle
	byID('info_title').value = eventData.clientData.info.title

	const switchHTML = []
	for ( const [idx, switchData] of eventData.clientData.switches.entries() ) {
		switchHTML.push(buildSwitch(idx, switchData))
	}
	byID('dyn_switches').innerHTML = switchHTML.join('')

	const timerHTML = []
	for ( const [idx, timerData] of eventData.clientData.timers.entries() ) {
		timerHTML.push(buildTimer(idx, timerData))
	}
	byID('dyn_timers').innerHTML = timerHTML.join('')
}

let switchModal       = null
let switchModalDelete = null

document.addEventListener('DOMContentLoaded', () => {
	fetch('/api/blank_record')
		.then( (response) => {
			if (response.status === 200) {
				response.json().then((data) => {
					eventData = data
					fetch('/api/remote_ip')
						.then( (response2) => {
							if (response2.status === 200) {
								response2.json().then((data2) => {
									eventData.internals.ipAddress = data2.ip
									eventData.internals.adminPass = data2.newPass
									fillFormData()
								})
							}
						}).catch( () => { /* do nothing */ })
				})
			}
		}).catch( () => { /* do nothing */ })

	switchModal       = new bootstrap.Modal('#switchModal')
	switchModalDelete = new bootstrap.Modal('#switchDelete')
})