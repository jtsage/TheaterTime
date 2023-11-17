/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2023 J.T.Sage - ISC License
*/
/* global QRious */
let payload_data = null
let isADMIN      = false

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

const printItemTime = (minutes) => {
	const hours = Math.floor(minutes / 60)
	const mins  = minutes - (hours * 60)
	return `-${hours.toString().padStart(2, 0)}:${mins.toString().padStart(2, 0)}:00`
}

const makeExtras = (id, extraArray) => {
	if ( typeof extraArray === 'undefined' ) { return '' }
	const returnHTML = []
	returnHTML.push('<div class="list-group mt-2">')
	for ( const [idx, thisItem] of extraArray.entries() ) {
		returnHTML.push(`
			<div class="list-group-item list-group-item-info d-flex justify-content-between align-items-start" id="${id}_${idx}_class">
			<em>${printItemTime(thisItem.time)}</em>
			${thisItem.name}
			<div class="form-check">
				<input class="form-check-input" onclick="clientItemButton('${id}', ${idx})" type="checkbox" value="" id="${id}_${idx}">
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

const makeTimer = (timerData, isFirst, isAdmin) => {
	const timeString = parseTimer(timerData)
	
	return `<div class="card text-bg-light ${!isFirst ? 'mt-2' : ''}">
		<div class="card-body text-center">
			<h5 class="card-title">${timerData.name}</h5>
			<span class="card-text h2 font-monospace" id="${timerData.id}">${timeString}</span>
			${makeExtras(timerData.id, timerData.items)}
		</div>
		${ timerData.is_active && isAdmin ?
		`<div class="card-footer"><div onclick="clientTimeButton('${timerData.id}')" class="btn btn-sm btn-primary w-75 mx-auto d-block">COMPLETE ${timerData.name}</div></div>` :
		'' }
	</div>`
}

const clientItemButton = (timerID, idx) => {
	let currentIndex = -1
	for ( const [timerIdx, timerData] of payload_data.timers.entries() ) {
		if ( timerData.id === timerID ) {
			currentIndex = timerIdx
			break
		}
	}
	payload_data.timers[currentIndex].items[idx].status = !payload_data.timers[currentIndex].items[idx].status
}

const clientTimeButton = (timerID) => {
	let currentIndex = -1
	let currentData = null
	for ( const [idx, timerData] of payload_data.timers.entries() ) {
		if ( timerData.id === timerID ) {
			currentIndex = idx
			currentData  = timerData
			break
		}
	}

	payload_data.timers[currentIndex].is_active = false
	payload_data.timers[currentIndex].is_done   = true

	if ( !currentData.is_down ) {
		payload_data.timers[currentIndex].elapse_total = (Date.now() - payload_data.timers[currentIndex].time_was_start) / 1000
	}

	if ( typeof payload_data.timers[currentIndex+1] !== 'undefined' ) {
		payload_data.timers[currentIndex+1].is_active = true
		payload_data.timers[currentIndex+1].time_was_start = Date.now()

		if ( payload_data.timers[currentIndex+1].reset_places ) {
			for ( const [idx, switchData] of payload_data.switches.entries() ) {
				if ( switchData.id === 'places' ) {
					payload_data.switches[idx].status = false
					break
				}
			}
		}
	}

	updateCounters(payload_data)
}

const clientAdminButton = (buttonName) => {
	for ( const [idx, switchData] of payload_data.switches.entries() ) {
		if ( switchData.id === buttonName ) {
			payload_data.switches[idx].status = !payload_data.switches[idx].status
			break
		}
	}

	updateCounters(payload_data)
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

const updateCounters = (data) => {
	//TODO : make this useful
	const is_admin = isADMIN

	if ( runningTimer !== null ) { clearInterval(runningTimer) }

	const switchHTML = []
	for ( const [idx, thisSwitch] of data.switches.entries() ) {
		switchHTML.push(makeSwitch(thisSwitch, idx === 0, is_admin))
	}

	const timerHTML = []
	for ( const [idx, thisTimer] of data.timers.entries() ) {
		timerHTML.push(makeTimer(thisTimer, idx === 0, is_admin))
	}

	const realStartTime = new Date(data.timers[0].time_to_end)

	byID('dyn_timer_contain').innerHTML  = timerHTML.join('')
	byID('dyn_switch_contain').innerHTML = switchHTML.join('')
	byID('dyn_event_title').innerHTML    = data.info.title
	byID('dyn_event_subtitle').innerHTML = data.info.subtitle
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

const getData = () => {
	const [timerID, _, secretToken] = document.location.pathname.replace('/', '').split('/')

	fetch(`/timer_backend/${timerID}/${secretToken}`)
		.then( (response) => {
			if (response.status !== 200) {
				alert('An Error Occurred : invalid record')
				return
			}
		
			response.json().then((data) => {
				payload_data = data.clientData
				isADMIN      = data.isAdmin

				updateCounters(payload_data)
			})
		}).catch( (err) => {
			alert(`An Error Occurred : ${err}`)
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