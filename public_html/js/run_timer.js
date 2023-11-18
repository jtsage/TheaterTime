/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2023 J.T.Sage - ISC License
*/
/* global QRious */
let payload_data = null
let isADMIN      = false
let autoRefresh  = null

const byID      = (elementID) => document.getElementById(elementID)
const IDReplace = (elementID, is_danger, innerHTML) => {
	const cls_remove =  is_danger ? 'text-bg-success' : 'text-bg-danger'
	const cls_add    = !is_danger ? 'text-bg-success' : 'text-bg-danger'
	byID(`${elementID}_text`).innerHTML = innerHTML
	byID(`${elementID}_class`).classList.remove(cls_remove)
	byID(`${elementID}_class`).classList.add(cls_add)
}
const TaskClassSwap = (elementID, is_overdue, is_done) => {
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

	const returnHTML = [
		'<div class="list-group mt-2">'
	]

	for ( const [idx, thisItem] of extraArray.entries() ) {
		const taskClass = thisItem.status ? 'list-group-item-success' : 'list-group-item-info'
		const taskCheck = thisItem.status ? 'checked' : ''

		returnHTML.push(`
			<div class="list-group-item ${taskClass} d-flex justify-content-between align-items-start" id="${id}_${idx}_class">
			<em>${printItemTime(thisItem.time)}</em>
			${thisItem.name}
			<div class="form-check">
				<input class="form-check-input" ${taskCheck} onclick="clientItemButton('${id}', ${idx})" type="checkbox" value="" id="${id}_${idx}">
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
	
	return `<div class="card text-bg-light ${!isFirst ? 'mt-2' : ''}">
		<div class="card-body text-center">
			<h5 class="card-title">${timerData.name}</h5>
			<span class="card-text h2 font-monospace" id="${timerData.id}">${timeString}</span>
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

const runActiveCount = () => {
	for ( const thisTimer of payload_data.timers ) {
		if ( thisTimer.is_active ) {
			byID(thisTimer.id).innerHTML = parseTimer(thisTimer)

			if ( typeof thisTimer.items !== 'undefined' ) {
				const minLeft = Math.floor(((thisTimer.time_to_end - Date.now()) / 1000) / 60)
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
	const [timerID, _, secretToken] = document.location.pathname.replace('/', '').split('/')

	const response = await fetch(`/timer_backend/set/${timerID}/${secretToken}`, {
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

	const [timerID, _, secretToken] = document.location.pathname.replace('/', '').split('/')

	fetch(`/timer_backend/read/${timerID}/${secretToken}`)
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

document.addEventListener('DOMContentLoaded', () => {
	const queryString = new URLSearchParams(document.location.search)
	
	if ( queryString.has('mobile') ) {
		byID('dyn_qr_code_class').classList.add('d-none')
	} else {
		new QRious({
			element : byID('dyn_qr_code'),
			value   : `${window.location.href}?mobile=true`,
		})
	}

	getData()
})