/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License

	Status
*/

import * as util from './rdr-utils'
import { DataStackLog, DataStackStatus, DataStackTimerUpdate } from 'src/lib/control'
import { TimerDefStatus, TimerUpdateToRender } from 'src/lib/timer'
import { SwitchDefSerial } from 'src/lib/switch'

let isInit = false

export const processTimeUpdate = ( data : DataStackTimerUpdate ) => {
	if ( !isInit ) {
		return
	}
	for ( const timer of data.timers ) {
		UpdateTimer( timer )
	}
}

export const processLogUpdate = ( data : DataStackLog ) => {
	const logContent = []
	for ( const item of data ) {
		const levelClass = item[2] === 0 ? 'text-body' : item[2] === 1 ? 'text-danger' : 'text-success'
		const itemHTML = [
			'<div>',
			`<span class="text-primary fw-bold">${item[3]}</span>`,
			`<span class="text-secondary"> :: ${item[0]} :: </span>`,
			`<span class="${levelClass}">${item[1].replaceAll( /\n/g, '<br>' )}`,
			'</div>'
		]
		logContent.push( itemHTML.join( '' ) )
	}
	util.setInnerHTML( 'log', logContent.join( '' ) )
}

export const processStatus = ( data : DataStackStatus ) => {
	util.setInnerHTML(
		'status-toggle',
		data.toggle.flatMap( ( toggle, index ) => {
			return StatusSwitch( toggle, index  )
		} ).join( '\n' )
	)

	util.setInnerHTML(
		'status-timer',
		data.timers.flatMap( ( timer, index ) => {
			return StatusTimer( timer, index === data.current_timer )
		} ).join( '\n' )
	)

	for ( const element of document.querySelectorAll( '.toggle-status-card' ) ) {
		element.addEventListener( 'click', ( e ) => {
			const target = e.target
			if ( target instanceof Element ) {
				const card = target.closest( '.toggle-status-card' )
				if ( card !== null ) {
					const index = card.getAttribute( 'data-index' )
					if ( index !== null ) {
						window.ipc.toggleSwitch( parseInt( index ) )
					}
				}
			}
		} )
	}

	isInit = true
}

const TimerItem = (
	title : string,
	value : string | undefined,
	extra : string | null = null,
	id    : string | null = null
) => {
	return [
		`<div class="d-flex ${extra !== null ? extra : ''}">`,
		`<div class="fw-bold w-25 text-start ps-2">${title}</div>`,
		`<div class="flex-grow-1 text-end pe-2 font-monospace" ${id !== null ? `id="${id}"` : ''}>${value}</div>`,
		'</div>'
	]
}

const ColorTimer = ( timer : Partial<TimerUpdateToRender> ) : [ string, string[]]=> {
	switch ( timer.status ) {
		case 1 : {
			if ( typeof timer.wholeSeconds !== 'undefined' && timer.wholeSeconds < 0 ) {
				return ['bg-danger-subtle', ['bg-success-subtle', 'bg-primary-subtle']]
			}
			return ['bg-success-subtle', ['bg-danger-subtle', 'bg-primary-subtle']]
		}
		case 2 :
			return ['bg-primary-subtle', ['bg-success-subtle', 'bg-danger-subtle']]
		default :
			return ['', ['bg-success-subtle', 'bg-primary-subtle', 'bg-danger-subtle']]
	}
}

const StatusTimer = ( timer : TimerDefStatus, isCurrent : boolean ) => {
	return [
		`<div class="card mb-2 w-100 timer-status-card ${ColorTimer( timer )[0]}">`,
		isCurrent ? '<div class="text-body-tertiary text-start pe-2 current-icon"><i class="bi bi-arrow-right-circle"></i></div>' : '',
		`<div class="card-header fw-bold text-center">${timer.title}</div>`,
		timer.sound_countdowns ? '<div class="text-body-tertiary text-end pe-2 audio-icon"><i class="bi bi-volume-up"></i></div>' : '',
		'<div class="card-body text-center p-1">',
		...TimerItem( timer.type !== 1 ? 'Remaining' : 'Elapsed', timer.formatTime, 'lead', timer.uuid ),
		...( timer.type !== 2 && timer.dateStarted !== null ) ? TimerItem( 'Started', new Date( timer.dateStarted ).toLocaleString() ) : [],
		...( timer.dateStopped !== null ) ? TimerItem( 'Stopped', new Date( timer.dateStopped ).toLocaleString() ) : [],
		'</div></div>'
	]
}

const UpdateTimer = ( timer : TimerUpdateToRender ) => {
	const color   = ColorTimer( timer )
	const time    = document.getElementById( timer.uuid )

	if ( time === null ) {
		return
	}

	const contain = time.closest( '.timer-status-card' )

	if ( contain === null ) {
		return
	}

	time.innerHTML = timer.formatTime ?? ''
	contain.classList.add( color[0] )
	contain.classList.remove( ...color[1] )
}

const StatusSwitch = ( toggle : SwitchDefSerial, index : number ) => {
	const color = ( toggle.status === 0 && !toggle.reverseColor ) || ( toggle.status === 1 && toggle.reverseColor ) ? 'danger-subtle' : 'success-subtle'
	return [
		`<div class="card mb-2 w-100 toggle-status-card bg-${color}" id="${toggle.id}" data-index="${index}">`,
		`<div class="card-header fw-bold text-center">${toggle.title}</div>`,
		'<div class="card-body text-center p-1 toggleText">',
		toggle.status === 0 ? toggle.textInactive : toggle.textActive,
		'</div></div>'
	]
}