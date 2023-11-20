/*  ___  _               _            ___  _
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2023 J.T.Sage - ISC License
*/

const byID      = (elementID) => document.getElementById(elementID)

document.addEventListener('DOMContentLoaded', () => {
	const queryString = new URLSearchParams(document.location.search)
	
	if ( queryString.has('pass') ) {
		fetch(`/api/list_all/${queryString.get('pass')}`, {
			cache          : 'no-cache',
			credentials    : 'same-origin',
			headers        : { 'Content-Type' : 'application/json' },
			mode           : 'cors',
			redirect       : 'follow',
			referrerPolicy : 'no-referrer',
		}).then((response) => response.json()).then((json) => {
			if ( json.status === 0 ) {
				const timerHTML = []
				for ( const timerItem of json.recordList ) {
					timerHTML.push(makeTimerItem(timerItem))
				}
				byID('dyn_local_timers').innerHTML = timerHTML.join('')
				byID('dyn_error_not_found').classList[timerHTML.length !== 0 ? 'add' : 'remove']('d-none')
				byID('dyn_error_bad_ip').classList.add('d-none')
				byID('dyn_error_bad_pass').classList.add('d-none')
			} else if ( json.statusMsg === 'admin-ip-invalid') {
				byID('dyn_error_not_found').classList.add('d-none')
				byID('dyn_error_bad_ip').classList.remove('d-none')
				byID('dyn_error_bad_pass').classList.add('d-none')
			} else {
				byID('dyn_error_not_found').classList.add('d-none')
				byID('dyn_error_bad_ip').classList.add('d-none')
				byID('dyn_error_bad_pass').classList.remove('d-none')
			}
		})
	} else {
		byID('dyn_error_not_found').classList.add('d-none')
		byID('dyn_error_bad_ip').classList.add('d-none')
		byID('dyn_error_bad_pass').classList.remove('d-none')
	}
})

const printTime     = (timestamp) => {
	const tempDate  = new Date(timestamp)
	const checkDate = new Date()
	
	if ( checkDate.getFullYear() === tempDate.getFullYear() && checkDate.getMonth() === tempDate.getMonth() && checkDate.getDate() === tempDate.getDate() ) {
		return `${tempDate.toLocaleTimeString()} today`
	}
	checkDate.setDate(checkDate.getDate() - 1)
	if ( checkDate.getFullYear() === tempDate.getFullYear() && checkDate.getMonth() === tempDate.getMonth() && checkDate.getDate() === tempDate.getDate() ) {
		return `${tempDate.toLocaleTimeString()} yesterday`
	}
	checkDate.setDate(checkDate.getDate() + 2)
	if ( checkDate.getFullYear() === tempDate.getFullYear() && checkDate.getMonth() === tempDate.getMonth() && checkDate.getDate() === tempDate.getDate() ) {
		return `${tempDate.toLocaleTimeString()} tomorrow`
	}
	
	return `${tempDate.toLocaleTimeString()} ${tempDate.toLocaleDateString()}`
}
const makeTimerItem = (timerItem) => {
	return `<a class="list-group-item list-group-item-light" href="/timer/${timerItem.timerID}/${timerItem.adminHash}">
		<strong class="font-monospace" style="white-space:pre">${timerItem.timerID} || ${timerItem.ip.padEnd(15, ' ')} :: </strong><strong>${timerItem.name}</strong> - ${timerItem.subtitle} <em>@${printTime(timerItem.startTime)}</em>, ${timerItem.timersRem} incomplete timers
	</a>`
}