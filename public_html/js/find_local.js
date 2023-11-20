/*  ___  _               _            ___  _
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2023 J.T.Sage - ISC License
*/

const byID      = (elementID) => document.getElementById(elementID)

fetch('/api/local_ip/', {
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
	} else {
		/* eslint-disable no-console */
		console.log(json)
		/* eslint-enable no-console */
		alert(`Operation failed: ${json.statusMsg}`)
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
	return `<a class="list-group-item list-group-item-light" href="/timer/${timerItem.timerID}/">
		<strong class="font-monospace">${timerItem.timerID} :: </strong><strong>${timerItem.name}</strong> - ${timerItem.subtitle} <em>@${printTime(timerItem.startTime)}</em>, ${timerItem.timersRem} incomplete timers
	</a>`
}