/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2023 J.T.Sage - ISC License
*/
/* global QRious, bootstrap */
let payload_data = null
let isADMIN      = false
let autoRefresh  = null

const [_d_, pageTimerID, pageSecretToken] = document.location.pathname.replace('/', '').split('/')

const byID      = (elementID) => document.getElementById(elementID)
const IDReplace = (elementID, is_danger, innerHTML) => {
	const cls_remove =  is_danger ? 'text-bg-success' : 'text-bg-danger'
	const cls_add    = !is_danger ? 'text-bg-success' : 'text-bg-danger'
	byID(`${elementID}_text`).innerHTML = innerHTML
	byID(`${elementID}_class`).classList.remove(cls_remove)
	byID(`${elementID}_class`).classList.add(cls_add)
}
const TaskClassSwap = (elementID, is_overdue, is_done) => {
	if ( byID(`${elementID}`) === null ) { return }

	byID(`${elementID}`).classList.remove(
		'list-group-item-info',
		'list-group-item-danger',
		'list-group-item-success'
	)
	if ( !is_overdue && !is_done ) {
		byID(`${elementID}`).classList.add('list-group-item-info')
	} else if ( is_done ) {
		byID(`${elementID}`).classList.add('list-group-item-success')
	} else {
		byID(`${elementID}`).classList.add('list-group-item-danger')
	}
}

let runningTimer = null

const printTime = (secondsLeft, icon = '') => {
	const hr_hourLeft = Math.floor(secondsLeft / 60 / 60)
	const hr_minLeft  = Math.floor((secondsLeft - hr_hourLeft*60*60) / 60)
	const hr_secLeft  = Math.floor(secondsLeft - ((hr_hourLeft*60*60) + (hr_minLeft*60)))
	return `${icon} ${hr_hourLeft.toString().padStart(2, 0)}:${hr_minLeft.toString().padStart(2, 0)}:${hr_secLeft.toString().padStart(2, 0)} ${icon}`
}

const printItemTime = (minutes) => {
	const hours = Math.floor(minutes / 60)
	const mins  = minutes - (hours * 60)
	return `-${hours.toString().padStart(2, 0)}:${mins.toString().padStart(2, 0)}:00`
}

const printFormatTime = (dateOBJ) => `${dateOBJ.getHours()%12 ? dateOBJ.getHours()%12 : 12}:${dateOBJ.getMinutes().toString().padStart(2, 0)} ${dateOBJ.getHours()>11?'PM':'AM'}`

const parseTimer = (timerData) => {
	if ( ! timerData.is_active && !timerData.is_done ) { return '--:--:--' }
	if ( timerData.is_done && timerData.is_down ) { return '00:00:00' }

	let secondsCount = 0
	let indicator    = ''
	
	if ( timerData.is_down ) {
		indicator = 'text-warning bi-arrow-down-square-fill'
		
		if ( timerData.time_to_end !== null ) {
			secondsCount = (timerData.time_to_end - Date.now()) / 1000
		} else {
			secondsCount = (( timerData.time_was_start + (timerData.min_to_count * 60 * 1000) ) - Date.now()) / 1000
		}

		if ( secondsCount <= 0 ) {
			secondsCount = secondsCount * -1
			indicator = 'text-danger bi-exclamation-diamond-fill'
		}
	} else if ( timerData.time_was_start === null ) {
		return 'e:rr:or'
	} else if ( timerData.is_done ) {
		secondsCount = Math.max(0, timerData.elapse_total)
	} else {
		indicator = 'bi-arrow-up-square-fill text-warning'
		secondsCount = Math.max(0, (Date.now() - timerData.time_was_start) / 1000)
	}

	return printTime(secondsCount, indicator !== '' ? `<i class="bi ${indicator}"></i>` : '')
}

const makeExtras = (id, extraArray, isAdmin) => {
	if ( typeof extraArray === 'undefined' || !isAdmin ) { return '' }

	let timer_index = 0
	for ( const [timerIDX, timerData] of payload_data.timers.entries() ) {
		if ( timerData.id === id ) {
			timer_index = timerIDX
			break
		}
	}

	const showTime = payload_data.timers[timer_index].is_down && payload_data.timers[timer_index].time_to_end !== null

	const returnHTML = [
		'<div class="list-group mt-2">'
	]

	for ( const [idx, thisItem] of extraArray.entries() ) {
		const taskClass = thisItem.status ? 'list-group-item-success' : 'list-group-item-info'
		const taskCheck = thisItem.status ? 'checked' : ''

		returnHTML.push(`
			<div class="list-group-item ${taskClass} d-flex justify-content-between align-items-start" id="${id}_${idx}_class">
			${showTime ? `<em>${printItemTime(thisItem.time)}</em>` : ''}
			${thisItem.name}
			<div class="form-check form-switch">
				<input role="switch" class="form-check-input" ${taskCheck} onclick="clientItemButton('${id}', ${idx})" type="checkbox" value="" id="${id}_${idx}">
			</div>
			</div>
		`)
	}
	returnHTML.push('</div>')
	return returnHTML.join('')
}

const makeSwitch = (switchData, isFirst, isAdmin) => {
	return `<div class="card text-bg-danger ${!isFirst ? 'mt-2' : ''}" id="dyn_status_${switchData.id}_class">
		<div class="card-body text-center">
			<h5 class="card-title">STATUS :  ${switchData.name}</h5>
			<p class="card-text" id="dyn_status_${switchData.id}_text">${switchData.switch_off}</p>
		</div>
		${ isAdmin ?
		`<div class="card-footer"><div onclick="clientAdminButton('${switchData.id}')" class="btn btn-sm btn-primary w-75 mx-auto d-block">SWITCH</div></div>` :
		'' }
	</div>`
}

const makeTimer = (timerData, isFirst, isLast, anyActive, isAdmin) => {
	const timeString  = parseTimer(timerData)
	const showButtons = isAdmin && (timerData.is_active || (isLast && !anyActive))

	const startStopString = []

	if ( timerData.time_was_start !== null ) {
		startStopString.push(`Start : ${printFormatTime(new Date(timerData.time_was_start))}`)
	}

	if ( timerData.time_was_end !== null ) {
		startStopString.push(`End : ${printFormatTime(new Date(timerData.time_was_end))}`)
	}
	
	return `<div class="card text-bg-light ${!isFirst ? 'mt-2' : ''}">
		<div class="card-body text-center">
			<h5 class="card-title">${timerData.name}</h5>
			
			<span class="card-text h2 font-monospace" id="${timerData.id}">${timeString}</span>
			<span class="card-text h6 font-monospace d-block mb-0 mt-1">${startStopString.join(' | ')}</span>
			${makeExtras(timerData.id, timerData.items, isAdmin)}
		</div>
		${ showButtons ? '<div class="card-footer"><div class="btn-group w-100">' : '' }
		${ isAdmin && timerData.is_active ? `<div onclick="clientTimeButton('${timerData.id}')" class="btn btn-sm btn-primary w-100">COMPLETE ${timerData.name}</div>` : ''}
		${ !isFirst && showButtons ? `<div onclick="clientTimeRevButton('${timerData.id}', ${anyActive})" class="btn btn-sm btn-danger w-100">GO BACK</div>` : ''}
		${ showButtons ? '</div></div>' : '' }
	</div>`
}

const clientItemButton = (timerID, idx) => {
	for ( const [timerIdx, timerData] of payload_data.timers.entries() ) {
		if ( timerData.id === timerID ) {
			setData('item', timerIdx, idx).then(() => { getData() })
			break
		}
	}
}

const clientTimeRevButton = (timerID, anyActive) => {
	if ( !anyActive ) {
		setData('timer_back', payload_data.timers.length).then(() => { getData() })
	} else {
		for ( const [idx, timerData] of payload_data.timers.entries() ) {
			if ( timerData.id === timerID ) {
				setData('timer_back', idx).then(() => { getData() })
				break
			}
		}
	}
}

const clientTimeButton = (timerID) => {
	for ( const [idx, timerData] of payload_data.timers.entries() ) {
		if ( timerData.id === timerID ) {
			setData('timer', idx).then(() => { getData() })
			break
		}
	}
}

const clientAdminButton = (buttonName) => {
	for ( const [idx, switchData] of payload_data.switches.entries() ) {
		if ( switchData.id === buttonName ) {
			setData('switch', idx).then(() => { getData() })
			break
		}
	}
	return false
}

const clientDoPasswordInput = (evt) => {
	if ( evt.code === 'Enter' ) { clientDoPassword() }
}
const clientDoPassword = () => {
	fetch('/api/hash_password', {
		body           : JSON.stringify( { password : byID('password').value } ),
		cache          : 'no-cache',
		credentials    : 'same-origin',
		headers        : { 'Content-Type' : 'application/json' },
		method         : 'POST',
		mode           : 'cors',
		redirect       : 'follow',
		referrerPolicy : 'no-referrer',
	}).then((response) => {
		response.json().then((json) => {
			document.location.href = `${document.location.origin}/timer/${pageTimerID}/${json.hashPass}`
		})
		
	})
}

const runActiveCount = () => {
	for ( const thisTimer of payload_data.timers ) {
		if ( thisTimer.is_active ) {
			byID(thisTimer.id).innerHTML = parseTimer(thisTimer)

			if ( typeof thisTimer.items !== 'undefined' ) {
				let minLeft = 1000000

				if ( thisTimer.is_down && thisTimer.time_to_end !== null ) {
					minLeft = Math.floor(((thisTimer.time_to_end - Date.now()) / 1000) / 60)
				}

				for ( const [idx, thisItem] of thisTimer.items.entries() ) {
					TaskClassSwap(
						`${thisTimer.id}_${idx}_class`,
						thisItem.time > minLeft,
						thisItem.status
					)
				}
			}
		}
	}
}

const updateCounters = () => {
	//TODO : make this useful
	const is_admin = isADMIN

	if ( runningTimer !== null ) { clearInterval(runningTimer) }

	const switchHTML = []
	for ( const [idx, thisSwitch] of payload_data.switches.entries() ) {
		switchHTML.push(makeSwitch(thisSwitch, idx === 0, is_admin))
	}

	const timerHTML = []
	let   anyActive = false
	for ( const [idx, thisTimer] of payload_data.timers.entries() ) {
		if ( thisTimer.is_active ) { anyActive = true }
		timerHTML.push(makeTimer(
			thisTimer,
			idx === 0,
			idx === payload_data.timers.length-1,
			anyActive,
			is_admin
		))
	}

	const realStartTime = new Date(payload_data.timers[0].time_to_end)

	if ( is_admin ) {
		byID('dyn_admin_login').classList.add('d-none')
		byID('dyn_admin_export').classList.remove('d-none')
		byID('dyn_admin_delete').classList.remove('d-none')
	} else {
		byID('dyn_admin_login').classList.remove('d-none')
		byID('dyn_admin_export').classList.add('d-none')
		byID('dyn_admin_delete').classList.add('d-none')
	}

	byID('dyn_timer_contain').innerHTML  = timerHTML.join('')
	byID('dyn_switch_contain').innerHTML = switchHTML.join('')
	byID('dyn_event_title').innerHTML    = payload_data.info.title
	byID('dyn_event_subtitle').innerHTML = payload_data.info.subtitle
	byID('dyn_time_start').innerHTML     = `${realStartTime.getHours()%12 ? realStartTime.getHours()%12 : 12}:${realStartTime.getMinutes().toString().padStart(2, 0)} ${realStartTime.getHours()>11?'PM':'AM'}`

	for ( const switchData of payload_data.switches ) {
		IDReplace(
			`dyn_status_${switchData.id}`,
			!switchData.status,
			!switchData.status ? switchData.switch_off : switchData.switch_on
		)
	}
	
	runningTimer = setInterval(runActiveCount, 500)
}

const setData = async (type, idx, subIdx = -1) => {
	const response = await fetch(`/api/set/${pageTimerID}/${pageSecretToken}`, {
		body           : JSON.stringify( { type : type, idx : idx, subIdx : subIdx } ),
		cache          : 'no-cache',
		credentials    : 'same-origin',
		headers        : { 'Content-Type' : 'application/json' },
		method         : 'POST',
		mode           : 'cors',
		redirect       : 'follow',
		referrerPolicy : 'no-referrer',
	})
	return response.json()
}

const getData = () => {
	if ( autoRefresh !== null ) {
		clearTimeout(autoRefresh)
		autoRefresh = null
	}

	fetch(`/api/read/${pageTimerID}/${pageSecretToken}`)
		.then( (response) => {
			if (response.status !== 200) {
				byID('dyn_error_not_found').classList.remove('d-none')
				return
			}

			response.json().then((data) => {
				const refreshTime = data.isAdmin ? 2500 : 15000
				payload_data      = data.clientData
				isADMIN           = data.isAdmin
				autoRefresh       = setTimeout(getData, refreshTime)

				byID('dyn_error_not_found').classList.add('d-none')
				byID('dyn_error_offline').classList.add('d-none')

				updateCounters()
			})
		}).catch( () => {
			byID('dyn_error_offline').classList.remove('d-none')
			autoRefresh = setTimeout(getData, 5 * 60 * 1000)
		})
}

const clientAskDelete = () => {	if ( isADMIN ) { deleteModal.show() } }

const clientDoDelete = () => {
	if ( !isADMIN ) { return }
	fetch(`/api/delete/${pageTimerID}/${pageSecretToken}`, {
		body           : JSON.stringify({}),
		cache          : 'no-cache',
		credentials    : 'same-origin',
		headers        : { 'Content-Type' : 'application/json' },
		method         : 'POST',
		mode           : 'cors',
		redirect       : 'follow',
		referrerPolicy : 'no-referrer',
	}).then((response) => {
		if ( response.status === 200 ) {
			document.location.href = document.location.origin
		} else {
			alert('Delete Failed!')
		}
	}).catch((err) => {
		alert(`Delete Failed : ${err}`)
	})
}

const clientDoExport = () => {
	const exportData = {
		internals : {
			adminPass : 'exported-data-redacted',
			ipAddress : '',
		},
		clientData : payload_data,
	}
	const bytes   = new TextEncoder().encode(JSON.stringify(exportData))
	const blob    = new Blob([bytes], { type : 'application/json;charset=utf-8' })
	const link    = document.createElement('a')
	link.href     = window.URL.createObjectURL(blob)
	link.download = 'theaterTimeExport.json'
	document.body.appendChild(link)
	link.click()
	link.remove()
}

let deleteModal = null

document.addEventListener('DOMContentLoaded', () => {
	const queryString = new URLSearchParams(document.location.search)
	
	if ( queryString.has('mobile') ) {
		byID('dyn_qr_code_class').classList.add('d-none')
	} else {
		new QRious({
			element : byID('dyn_qr_code'),
			value   : `${window.location.origin}/timer/${pageTimerID}/?mobile=true`,
		})
	}

	deleteModal = new bootstrap.Modal('#deleteModal')

	byID('loginModal').addEventListener('shown.bs.modal', () => {
		byID('password').focus()
	})

	getData()
})