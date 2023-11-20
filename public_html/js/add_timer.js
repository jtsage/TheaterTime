/*  ___  _               _            ___  _
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2023 J.T.Sage - ISC License
*/
/* global bootstrap */

const sanity    = (elementName, is_ok) => {
	byID(`check_${elementName}_ok`).classList[ is_ok ? 'remove' : 'add']('d-none')
	byID(`check_${elementName}_no`).classList[!is_ok ? 'remove' : 'add']('d-none')
	return is_ok ? 0 : 1
}

const byID      = (elementID) => document.getElementById(elementID)
const _zPad     = (text, places = 2) => text.toString().padStart(places, 0)
const tzAdjust  = (epoch) => epoch + (new Date().getTimezoneOffset()*60*1000)
const localISO  = (thisDate) => {
	return `${thisDate.getFullYear()}-${_zPad(thisDate.getMonth()+1)}-${_zPad(thisDate.getDate())}T${_zPad(thisDate.getHours())}:${_zPad(thisDate.getMinutes())}`
}
const printItemTime = (minutes) => {
	const hours = Math.floor(minutes / 60)
	const mins  = minutes - (hours * 60)
	return `-${hours.toString().padStart(2, 0)}:${mins.toString().padStart(2, 0)}:00`
}

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
				<div class="col-10">
					<div class="row g-0">
						<div class="col-3"><strong>Time</strong></div><div class="col-9">${printItemTime(itemData.time)}</div>
						<div class="col-3"><strong>Text</strong></div><div class="col-9">${itemData.name}</div>
					</div>
				</div>
				<div class="col-2 text-center align-self-center">
					<div class="btn btn-sm btn-danger" title="Delete" onclick="clientDeleteTimerItem(${idx}, ${itemIDX})"><i class="bi bi-trash3"></i></div>
				</div>
			</li>`)
		}
	}
	extraItemsHTML.push(`<li class="list-group-item list-group-item-light"><div class="row">
		<div class="col-10"></div>
		<div class="col-2 align-self-center text-center">
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
				<li class="list-group-item list-group-item-light"><strong>End Time</strong> : ${timerData.is_down && timerData.time_to_end !== null ? new Date(timerData.time_to_end).toLocaleString() : '<em>--</em>' }</li>
				<li class="list-group-item list-group-item-light"><strong>Minutes to Count</strong> : ${timerData.is_down && timerData.min_to_count !== null ? timerData.min_to_count : '<em>--</em>'}</li>
				<li class="list-group-item list-group-item-light"><strong>Reset Places Switch</strong> : ${timerData.reset_places ? 'YES' : 'no'}</li>
			</ul>
			<div class="text-bg-info text-white p-2 text-center"><strong>Extra Items</strong></div>
			${extraItemsHTML.length !== 0 ? extraItemsHTML.join('') : '' }
		</div>
	</div>`
}

const clientEditTimer = (idx) => {
	const timerData = idx === -1 ? null : eventData.clientData.timers[idx]
	let timerType   = 1

	if ( idx > -1 ) {
		if ( timerData.is_down && timerData.min_to_count !== null ) {
			timerType = 3
		} else if ( timerData.is_down ) {
			timerType = 2
		}
	}

	byID('timer_idx').value            = idx
	byID('timer_id').value             = idx === -1 ? ''    : timerData.id
	byID('timer_name').value           = idx === -1 ? ''    : timerData.name
	byID('timer_type').value           = timerType
	byID('timer_minutes').value        = idx === -1 ? 0     : timerData.min_to_count ?? 0
	byID('timer_reset_places').checked = idx === -1 ? false : timerData.reset_places

	if ( idx > -1 && timerData.time_to_end !== null ) {
		byID('timer_end_time').value = localISO(new Date(timerData.time_to_end))
	} else {
		byID('timer_end_time').value = ''
	}

	clientUpdateTimerType()
	timerModal.show()
}

const clientUpdateTimerType = () => {
	const timerType = parseInt(byID('timer_type').value)
	
	byID('timer_minutes').disabled  = ! (timerType === 3)
	byID('timer_end_time').disabled = ! (timerType === 2)
}

const clientDoTimerEdit = () => {
	const timerIDX  = byID('timer_idx').value
	const timerType = parseInt(byID('timer_type').value)

	let proposedID = byID('timer_id').value

	if ( timerIDX < 0 ) {
		for ( const switchData of eventData.clientData.switches ) {
			if (switchData.id === proposedID) {
				proposedID = `${proposedID}_${eventData.clientData.switches.length}`
			}
		}
	}

	const newData   = {
		id           : proposedID,
		is_down      : timerType !== 1,
		items        : [],
		min_to_count : timerType === 3 ? parseInt(byID('timer_minutes').value) : null,
		name         : byID('timer_name').value,
		reset_places : byID('timer_reset_places').checked,
		time_to_end  : timerType === 2 ? tzAdjust(byID('timer_end_time').valueAsNumber) : null,
	}

	if ( timerIDX > -1 ) {
		newData.items = eventData.clientData.timers[timerIDX].items ?? []
		eventData.clientData.timers[timerIDX] = newData
	} else {
		eventData.clientData.timers.push(newData)
	}
	timerModal.hide()
	fillFormData()
}

const clientDeleteTimer = (idx) => {
	byID('timer_delete_idx').value = idx
	timerModalDelete.show()
}

const clientDoTimerDelete = () => {
	const timerIDX = byID('timer_delete_idx').value
	if ( timerIDX > -1 ) { eventData.clientData.timers.splice(timerIDX, 1) }
	timerModalDelete.hide()
	fillFormData()
}

const clientMoveTimer = (idx, direction) => {
	const from = idx
	const to   = direction < 0 ? idx + 1 : idx -1
	eventData.clientData.timers.splice(to, 0, eventData.clientData.timers.splice(from, 1)[0])
	fillFormData()
}

const clientDeleteTimerItem = (timerIDX, itemIDX) => {
	byID('timer_delete_item_timer_idx').value = timerIDX
	byID('timer_delete_item_item_idx').value  = itemIDX
	itemModalDelete.show()
}

const clientDoTimerItemDelete = () => {
	const timerIDX = byID('timer_delete_item_timer_idx').value
	const itemIDX  = byID('timer_delete_item_item_idx').value
	if ( timerIDX > -1 && itemIDX > -1 ) {
		eventData.clientData.timers[timerIDX].items.splice(itemIDX, 1)
	}
	itemModalDelete.hide()
	fillFormData()
}

const clientAddTimerItem = (timerIDX) => {
	byID('timer_add_item_idx').value = timerIDX
	itemModal.show()
}

const clientDoTimerItemAdd = () => {
	const timerIDX = byID('timer_add_item_idx').value
	if ( timerIDX > -1 ) {
		eventData.clientData.timers[timerIDX].items ??= []
		eventData.clientData.timers[timerIDX].items.push({
			name : byID('item_name').value,
			time : parseInt(byID('item_minutes').value),
			status : false,
		})
	}
	itemModal.hide()
	fillFormData()
}

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

const clientCheckEvent = () => {
	let problem_count = 0
	problem_count += sanity('pass', eventData?.internals?.adminPass !== '')

	const test_switch = sanity('count_switch', eventData?.clientData?.switches?.length !== 0)
	const switchIDs   = test_switch === 0 ? eventData.clientData.switches.map((x) => x.id) : []
	problem_count += test_switch
	problem_count += sanity('id_switch', test_switch === 0 && switchIDs.length === new Set(switchIDs).size )
	problem_count += sanity('switch_places', test_switch === 0 && switchIDs.includes('places') )

	const test_timer  = sanity('count_timer', eventData?.clientData?.timers?.length !== 0)
	const timerIDs    = test_timer === 0 ? eventData.clientData.timers.map((x) => x.id) : []
	problem_count += test_timer
	problem_count += sanity('id_timer', test_timer === 0 && timerIDs.length === new Set(timerIDs).size )
	problem_count += sanity('first_timer', test_timer === 0 && eventData.clientData.timers[0].is_down && eventData.clientData.timers[0].time_to_end !== null )
	
	byID('check_create_button').disabled = problem_count
	checkModal.show()
}

const clientDoCreate = () => {
	fetch('/api/add/', {
		body           : JSON.stringify( eventData ),
		cache          : 'no-cache',
		credentials    : 'same-origin',
		headers        : { 'Content-Type' : 'application/json' },
		method         : 'POST',
		mode           : 'cors',
		redirect       : 'follow',
		referrerPolicy : 'no-referrer',
	}).then((response) => response.json()).then((json) => {
		if ( json.status === 0 ) {
			document.location.href = `${document.location.origin}/timer/${json.timerID}/${json.adminHash}`
		} else {
			/* eslint-disable no-console */
			console.log(json)
			/* eslint-enable no-console */
			alert(`Operation failed: ${json.statusMsg}`)
		}
	})
}

const clientDoExport = () => {
	const bytes   = new TextEncoder().encode(JSON.stringify(eventData))
	const blob    = new Blob([bytes], { type : 'application/json;charset=utf-8' })
	const link    = document.createElement('a')
	link.href     = window.URL.createObjectURL(blob)
	link.download = 'theaterTimeExport.json'
	document.body.appendChild(link)
	link.click()
	link.remove()
}

const clientDoImport = () => {
	if ( byID('importFile').files.length !== 0 ) {
		const reader = new FileReader()
		
		reader.addEventListener(
			'load',
			() => {
				// this will then display a text file
				try {
					const newJSON = JSON.parse(reader.result)
					eventData     = newJSON

					fetch('/api/remote_ip')
						.then( (response2) => {
							if (response2.status === 200) {
								response2.json().then((data2) => {
									eventData.internals.ipAddress = data2.ip
									alert('Import Successful')
									fillFormData()
								})
							}
						}).catch( () => { /* do nothing */ })
				} catch (err) {
					alert(`Unable to parse JSON : ${err}`)
				} finally {
					byID('importFile').value = ''
				}
			},
			false
		)
		reader.readAsText(byID('importFile').files[0])
	}
}

let switchModal       = null
let switchModalDelete = null
let timerModal        = null
let timerModalDelete  = null
let itemModal         = null
let itemModalDelete   = null
let checkModal        = null

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
	timerModal        = new bootstrap.Modal('#timerModal')
	timerModalDelete  = new bootstrap.Modal('#timerDelete')
	itemModal         = new bootstrap.Modal('#timerItemModal')
	itemModalDelete   = new bootstrap.Modal('#timerItemDelete')
	checkModal        = new bootstrap.Modal('#checkModal')
})