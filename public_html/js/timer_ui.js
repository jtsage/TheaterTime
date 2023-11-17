/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2023 J.T.Sage - ISC License
*/
/* global QRious */

const byID = (elementID) => document.getElementById(elementID)
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

const start_time = new Date()
start_time.setHours(19)
start_time.setMinutes(30)
start_time.setSeconds(0)
start_time.setMilliseconds(0)

let runningTimer = null

const payload_data = {
	currentTimerIndex : 2,
	info : {
		title    : 'Some Example Theater',
		subtitle : 'Some Example Show',
	},
	status : {
		house  : false,
		mics   : false,
		places : false,
	},
	timers : [
		{
			elapse_total   : 0,
			id             : 'timer_pre_show',
			is_active      : true, // is running?
			is_done        : false, // is finished?
			is_down        : true, // is a countdown?
			min_to_count   : null, // number of minutes of part
			name           : 'Pre Show',
			reset_places   : false, // reset the places flag when this starts
			time_to_end    : start_time.getTime(), // e.g. 7:30PM today, from a real date obj
			time_was_start : null, // timestamp (int) of start of this if countdown # of min or count up

			items          : [
				{ name : 'Turn on bass wireless', time : 30, status : false },
				{ name : 'Turn off portrait lights', time : 5, status : false },
			],
		},
		{
			elapse_total   : 0,
			id             : 'timer_act_1',
			is_active      : false,
			is_done        : false,
			is_down        : false,
			min_to_count   : null,
			name           : 'Act 1',
			reset_places   : false,
			time_to_end    : null,
			time_was_start : null,
		},
		{
			elapse_total   : 0,
			id             : 'timer_intermission',
			is_active      : false,
			is_done        : false,
			is_down        : true,
			min_to_count   : 15,
			name           : 'Intermission',
			reset_places   : true,
			time_to_end    : null,
			time_was_start : null,
		},
		{
			elapse_total   : 0,
			id             : 'timer_act_2',
			is_active      : false,
			is_done        : false,
			is_down        : false,
			min_to_count   : null,
			name           : 'Act 2',
			reset_places   : false,
			time_to_end    : null,
			time_was_start : null,
		},
	],
}

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

const makeTimer = (timerData, isFirst) => {
	const timeString = parseTimer(timerData)
	
	return `<div class="card text-bg-light ${!isFirst ? 'mt-2' : ''}">
		<div class="card-body text-center">
			<h5 class="card-title">${timerData.name}</h5>
			<p class="card-text small mb-0">Time ${timerData.is_down ? 'Remaining' : 'Elapsed'}</p>
			<span class="card-text h2 font-monospace" id="${timerData.id}">${timeString}</span>
			${makeExtras(timerData.id, timerData.items)}
		</div>
		${ timerData.is_active ?
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
			payload_data.status.places = false
		}
	}

	updateCounters(payload_data)
}

const clientAdminButton = (buttonName) => {
	switch (buttonName) {
		case 'mics' :
			payload_data.status.mics = !payload_data.status.mics
			break
		case 'house' :
			payload_data.status.house = !payload_data.status.house
			break
		case 'places' :
			payload_data.status.places = !payload_data.status.places
			break
		default :
			break
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
	if ( runningTimer !== null ) { clearInterval(runningTimer) }

	const timerHTML = []
	for ( const [idx, thisTimer] of data.timers.entries() ) {
		timerHTML.push(makeTimer(thisTimer, idx === 0))
	}

	const realStartTime = new Date(data.timers[0].time_to_end)

	byID('dyn_timer_contain').innerHTML  = timerHTML.join('')
	byID('dyn_event_title').innerHTML    = data.info.title
	byID('dyn_event_subtitle').innerHTML = data.info.subtitle
	byID('dyn_time_start').innerHTML     = `${realStartTime.getHours()%12 ? realStartTime.getHours()%12 : 12}:${realStartTime.getMinutes().toString().padStart(2, 0)} ${realStartTime.getHours()>11?'PM':'AM'}`

	IDReplace('dyn_status_places', !data.status.places, !data.status.places ? 'has NOT' : 'HAS')
	IDReplace('dyn_status_house', !data.status.house, !data.status.house ? 'NOT open' : 'OPEN')
	IDReplace('dyn_status_mics', !data.status.mics, !data.status.mics ? 'NOT ready' : 'READY')
	
	runningTimer = setInterval(runActiveCount, 500)
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

	updateCounters(payload_data)
})