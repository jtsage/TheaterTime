/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License

	Configuration Interaction
*/

import { IpcType } from './preload'

declare global {
	interface Window {
		ipc : IpcType
	}
}

import * as bootstrap from 'bootstrap'
import * as util from './rdr-utils'

import { TTSaveFile, TTSettings } from 'src/lib/control'
import { TimerDef, TimerSave }   from 'src/lib/timer'
import { SwitchDef, SwitchDefConfig }  from 'src/lib/switch'

let saveWarningModal : bootstrap.Modal

interface winStatusInterface {
	dirty : boolean,
	logInterval : ReturnType<typeof setInterval> | null,
	nextTab :  bootstrap.Tab | null,
	switchList : [string, string][],
	timerCount : number
}

const winStatus : winStatusInterface = {
	dirty       : true,
	logInterval : null,
	nextTab     : null,
	switchList  : [],
	timerCount  : 0,
}

const TimerBlank : TimerDef = {
	minutes          : null,
	reset_switches   : [],
	sound_countdowns : false,
	sound_extra      : '',
	target           : null,
	title            : null,
	type             : 0,
}

const SwitchBlank : SwitchDef = {
	reset_switches : [],
	reverseColor   : false,
	speak          : null,
	textActive     : '',
	textInactive   : '',
	title          : '',
}

// MARK: startup config
export const configStartup = () => {
	const saveModal = util.getId( 'save-warning' )
	if ( saveModal !== null ) {
		saveWarningModal = new bootstrap.Modal( saveModal )
	}

	util.listenToId( 'click-add-timer', 'click', () => {
		clientAddTimer()
	} )
	util.listenToId( 'click-add-switch', 'click', () => {
		clientAddSwitch()
	} )
	util.listenToId( 'click-save-config', 'click', () => {
		clientSaveConfig()
	} )
	
	const configPane = util.getId( 'config-tab-pane' )
	if ( configPane !== null ) {
		for ( const element of configPane.querySelectorAll( 'input' ) ) {
			element.addEventListener( 'change', () => {
				winStatus.dirty = true
			} )
		}
	}
	
	const configSendCombo = util.getFormId( 'send-combo' )
	if ( configSendCombo !== null ) {
		configSendCombo.addEventListener( 'change', () => {
			if ( configSendCombo.validity.valid ) {
				util.setFormEnabled( 'click-save-config', true )
				util.classAdd( 'send-combo-error', 'd-none' )
			} else {
				util.setFormEnabled( 'click-save-config', false )
				util.classRemove( 'send-combo-error', 'd-none' )
			}
		} )
	}
	
	util.listenToId( 'discard-button', 'click', () => {
		window.ipc.config()
		saveWarningModal.hide()
		if ( winStatus.nextTab !== null ) {
			winStatus.nextTab.show()
		}
		winStatus.nextTab = null
	} )

	for ( const triggerEl of document.querySelectorAll( '#main-tab button' ) ) {
		const tabTrigger = new bootstrap.Tab( triggerEl )

		triggerEl.addEventListener( 'click', ( e ) => {
			e.preventDefault()

			if ( winStatus.logInterval !== null ) {
				clearInterval( winStatus.logInterval )
				winStatus.logInterval = null
			}

			if ( winStatus.dirty ) {
				winStatus.nextTab = tabTrigger
				saveWarningModal.show()
			} else {
				if ( e.target instanceof Element && e.target.id === 'log-tab' ) {
					window.ipc.updateLog()
					winStatus.logInterval = setInterval( () => {
						window.ipc.updateLog()
					}, 1000 )
				}
				tabTrigger.show()
			}
		} )
	}
}

// MARK: config receive
export const updateConfig = ( data : TTSaveFile ) => {
	updateConfigPane( data.settings )

	winStatus.dirty      = false
	winStatus.timerCount = data.timers.length
	winStatus.switchList = data.toggle.map( ( toggle ) => [toggle.id, toggle.title] )

	util.setInnerHTML( 'toggle-config', data.toggle.map( ( toggle, index ) => {
		return SwitchConfigHTML( toggle, index )
	} ).join( '\n' ) )

	util.setInnerHTML( 'timer-config', data.timers.map( ( timer, index ) => {
		return TimerConfigHTML( timer, index )
	} ).join( '\n' ) )

	timer_details()

	for ( const element of document.querySelectorAll( '#timer-config select, #timer-config input, #toggle-config input, #toggle-config select' ) ) {
		element.addEventListener( 'change', ( e ) => {
			timer_details()
			mark_item( e )
		} )
	}

	for ( const element of document.querySelectorAll( '.action-btn' ) ) {
		switch ( element.getAttribute( 'data-action' ) ) {
			case 'reload' :
				element.addEventListener( 'click', () => window.ipc.config() )
				break
			case 'remove-timer' :
				element.addEventListener( 'click', ( e ) => remove_item( e, 'timer' ) )
				break
			case 'remove-switch' :
				element.addEventListener( 'click', ( e ) => remove_item( e, 'switch' ) )
				break
			case 'save-timer' :
				element.addEventListener( 'click', () => save_timer() )
				break
			case 'save-switch' :
				element.addEventListener( 'click', () => save_switch() )
				break
			default :
				break
		}
	}
	util.classRemove( 'click-add-switch', 'd-none' )
	util.classRemove( 'click-add-timer', 'd-none' )
}

// MARK: save_timer
const save_timer = () => {
	const container = util.getId( 'timer-config' )
	const saveData  : TimerDef[] = []

	if ( container === null ) {
		return
	}

	for ( const form of container.getElementsByTagName( 'form' ) ) {
		const formData = new FormData( form )
		const jsonData : TimerDef = { ...TimerBlank }

		for ( const pair of formData.entries() ) {
			if ( pair[0].substring( 0, 16 ) === 'reset_switches--' ) {
				jsonData.reset_switches.push( pair[1].toString() )
			} else if ( pair[0] === 'type' ) {
				jsonData.type = parseInt( pair[1].toString(), 10 )
			} else if ( pair[1] === 'true' || pair[1] === 'false' ) {
				jsonData[pair[0]] = pair[1] === 'true'
			} else if ( pair[0] === 'minutes' ) {
				jsonData.minutes = parseInt( pair[1].toString(), 10 )
			} else {
				jsonData[pair[0]] = pair[1]
			}
			switch ( jsonData?.type ) {
				case 1 :
					jsonData.minutes = null
					jsonData.target = null
					break
				case 2 :
					jsonData.minutes = null
					break
				case 3 :
					jsonData.target = null
					break
				default :
					break
			}
		}
		saveData.push( jsonData )
	}

	window.ipc.saveTimer( saveData )
}

// MARK: save_switch
const save_switch = () => {
	const container = util.getId( 'toggle-config' )
	const saveData  = []

	if ( container === null ) {
		return
	}

	for ( const form of container.getElementsByTagName( 'form' ) ) {
		const formData = new FormData( form )
		const jsonData : SwitchDef = { ...SwitchBlank }

		for ( const pair of formData.entries() ) {
			if ( pair[0].substring( 0, 16 ) === 'reset_switches--' ) {
				jsonData.reset_switches!.push( pair[1].toString() )
			} else if ( pair[1] === 'true' || pair[1] === 'false' ) {
				jsonData[pair[0]] = pair[1] === 'true'
			} else {
				jsonData[pair[0]] = pair[1]
			}
		}
		saveData.push( jsonData )
	}

	window.ipc.saveSwitch( saveData )
}

// MARK: remove_item
const remove_item = ( e : Event, type = 'switch' ) => {
	if ( ! ( e.target instanceof Element ) ) {
		return
	}
	const button = e.target.tagName === 'button' ? e.target : e.target.closest( 'button' )
	if ( button !== null ) {
		const index  = button.getAttribute( 'data-index' )
		if ( index !== null ) {
			switch ( type ) {
				case 'switch' :
					window.ipc.removeSwitch( parseInt( index, 10 ) )
					break
				case 'timer' :
					window.ipc.removeTimer( parseInt( index, 10 ) )
					break
				default : break
			}
		}
	}
}

// MARK: mark_item
const mark_item = ( e : Event ) => {
	winStatus.dirty = true
	if ( e.target instanceof Element ) {
		const card = e.target.closest( 'div.card' )
		if ( card !== null ) {
			card.classList.add( 'bg-primary-subtle' )

			const container = card.parentElement
			for ( const element of container!.querySelectorAll( '.action-btn[data-action="reload"], .action-btn[data-action^="save-"]' ) ) {
				element.classList.remove( 'd-none' )
			}
		}
	}
}

// MARK: timer_details
const timer_details = () => {
	for ( const card of document.querySelectorAll( '.timer-card' ) ) {
		const typeSelector = card.querySelector( 'select[name="type"]' ) as HTMLInputElement | null
		switch ( typeSelector?.value ) {
			case '1' : //count-up
				util.safeClassAdd( card.querySelector( 'input[name="minutes"]' )?.parentElement, 'd-none' )
				util.safeClassAdd( card.querySelector( 'input[name="target"]' )?.parentElement, 'd-none' )
				util.safeClassRem( card.querySelector( '.select-resets' ), 'd-none' )
				util.safeClassAdd( card.querySelector( '.toggle-sound_countdowns' ), 'd-none' )
				util.safeClassAdd( card.querySelector( 'input[name="sound_extra"]' )?.parentElement, 'd-none' )
				break
			case '2' : //count-down
				util.safeClassAdd( card.querySelector( 'input[name="minutes"]' )?.parentElement, 'd-none' )
				util.safeClassRem( card.querySelector( 'input[name="target"]' )?.parentElement, 'd-none' )
				util.safeClassRem( card.querySelector( '.select-resets' ), 'd-none' )
				util.safeClassRem( card.querySelector( '.toggle-sound_countdowns' ), 'd-none' )
				util.safeClassRem( card.querySelector( 'input[name="sound_extra"]' )?.parentElement, 'd-none' )
				break
			case '3' : //count-minutes
				util.safeClassRem( card.querySelector( 'input[name="minutes"]' )?.parentElement, 'd-none' )
				util.safeClassAdd( card.querySelector( 'input[name="target"]' )?.parentElement, 'd-none' )
				util.safeClassRem( card.querySelector( '.select-resets' ), 'd-none' )
				util.safeClassRem( card.querySelector( '.toggle-sound_countdowns' ), 'd-none' )
				util.safeClassRem( card.querySelector( 'input[name="sound_extra"]' )?.parentElement, 'd-none' )
				break
			default :
				break
		}
	}
}

const timer_date_time = ( date : string | Date | null ) => {
	const dateObj = date instanceof Date ? date : date !== null ? new Date( date ) : new Date()
	// eslint-disable-next-line @stylistic/newline-per-chained-call
	return `${dateObj.getFullYear()}-${( dateObj.getMonth()+1 ).toString().padStart( 2, '0' )}-${dateObj.getDate().toString().padStart( 2, '0' )}T${dateObj.getHours().toString().padStart( 2, '0' )}:${dateObj.getMinutes().toString().padStart( 2, '0' )}`
}

// MARK: timer HTML
const TimerConfigHTML = ( timer : TimerSave, index : number, create = false ) => {
	return [
		'<div class="card mb-2 timer-card">',
		'<div class="card-header d-flex">',
		`<div class="fw-bold">Timer #${index+1}</div><div class="me-0 ms-auto">`,
		...util.HTMLButtons( 'timer', index, create, true ),
		'</div></div>',
		'<div class="card-body p-1"><form>',

		...util.HTMLFormText( 'title', timer.title, 'Title' ),
		...util.HTMLTimerType( timer.type ),
		...util.HTMLToggleButton(
			'sound_countdowns',
			'Sound',
			timer.sound_countdowns,
			'Play sounds for 90, 60, 30, 20, 15, 10, &amp; 5 minutes remain',
			{
				falseColor : 'primary',
				falseText  : 'Disabled',
				trueColor  : 'success',
				trueText   : 'Enabled',
			}
		),
		...util.HTMLFormText( 'sound_extra', timer.sound_extra, 'Extra Audio', 'Prepend this statement to audio cues played by this timer' ),

		'<div class="input-group mb-1">',
		'<span title="Title of timer" class="input-group-text w-25">Minutes</span>',
		`<input type="number" step="1" min="1" max="60" class="form-control text-end" name="minutes" value="${timer.minutes !== null ? timer.minutes : 10}">`,
		'</div>',
		
		'<div class="input-group mb-1">',
		'<span title="Title of timer" class="input-group-text w-25">Target</span>',
		`<input type="datetime-local" class="form-control text-end" name="target" value="${timer_date_time( timer.target )}">`,
		'</div>',

		...HTMLSelectResets( timer.reset_switches ),

		'</form></div>',
		'</div>'
	].join( '\n' )
}

// MARK: switch HTML
const SwitchConfigHTML = ( toggle : SwitchDefConfig, index : number, create = false ) => {
	return [
		`<div class="card mb-2" data-index="${index}">`,
		'<div class="card-header d-flex">',
		`<div class="fw-bold">Switch #${index+1}</div><div class="me-0 ms-auto">`,
		...util.HTMLButtons( 'switch', index, create, false ),
		'</div></div>',
		'<div class="card-body p-1"><form>',

		...util.HTMLFormText( 'title', toggle.title, 'Title' ),
		...util.HTMLFormText( 'textActive', toggle.textActive, 'Active Text' ),
		...util.HTMLFormText( 'textInactive', toggle.textInactive, 'Inactive Text' ),
		...util.HTMLFormText( 'speak', toggle.speak, 'Speak', 'Spoken Text.  Use \' & \' for a longer pause.' ),

		...util.HTMLToggleButton(
			'reverseColor',
			'Color',
			toggle.reverseColor,
			null,
			{
				falseColor : 'primary',
				falseText  : 'Standard',
				trueColor  : 'danger',
				trueText   : 'Reversed',
			}
		),
		...HTMLSelectResets( toggle.reset_switches, toggle.id ),

		'</form></div></div>'
	].join( '\n' )
}


const HTMLSelectResets = ( selected : null | string[], skip : string | null = null ) => {
	const selects = Array.isArray( selected ) ? selected : []
	return [
		'<div class="input-group mb-1 select-resets">',
		'<span title="Reset switches on start" class="input-group-text w-25">Reset Switch(es)</span>',
		'<div class="form-control">',
		...winStatus.switchList.flatMap( ( element ) => {
			if ( skip === element[0] ) {
				return []
			}
			let isSelected = false
			for ( const check of selects ) {
				if ( check === element[0] ) {
					isSelected = true
				}
			}
			return [
				`<div><input name="reset_switches--${element[0]}" class="form-check-input" type="checkbox" value="${element[0]}" ${isSelected ? 'checked' : ''}>`,
				`<label class="form-check-label" for="checkDefault">${element[1]}</label></div>`
			]
		} ),
		'</div></div>'
	]
}

// MARK: general set
const updateConfigPane = ( settings : TTSettings ) => {
	util.setFormCheck( 'audio-enabled', settings.audio.enabled )

	util.setFormValue( 'receive-port', settings.receive.port.toString() )

	util.setFormCheck( 'send-active', settings.send.active )
	util.setFormCheck( 'send-blink',  settings.send.blink )
	util.setFormValue( 'send-combo',  settings.send.combo )
	util.setFormCheck( 'send-eos',    settings.send.eos )
	util.setFormCheck( 'send-switch', settings.send.switch )
	util.setFormCheck( 'send-toggle', settings.send.toggle )

	const audioSinkSelect = util.getId( 'audio-sinkID' )
	if ( audioSinkSelect !== null ) {
		navigator.mediaDevices.enumerateDevices().then( ( devList ) => {
			const selectHTML = []
			for ( const device of devList ) {
				if ( device.kind !== 'audiooutput' ) {
					continue
				}
				selectHTML.push( util.HTMLOption(
					device.deviceId,
					device.label,
					settings.audio.sinkID === device.deviceId || ( device.deviceId === 'default' && settings.audio.sinkID === null )
				) )
			}
			audioSinkSelect.innerHTML = selectHTML.join( '' )
		} )
	}

	const audioNameSelect = util.getId( 'audio-voiceID' )
	if ( audioNameSelect !== null ) {
		window.ipc.voiceList().then( ( voiceList ) => {
			const selectHTML      = []
			for ( const voice of voiceList ) {
				selectHTML.push( util.HTMLOption(
					voice,
					voice,
					settings.audio.voiceID === voice
				) )
			}
			audioNameSelect.innerHTML = selectHTML.join( '' )
		} )
	}
}

function clientSaveConfig() {
	winStatus.dirty = false
	const sinkIDRaw = util.getSelectValue( 'audio-sinkID' )

	const settings : TTSettings = {
		audio : {
			enabled : util.getFormCheck( 'audio-enabled' ),
			sinkID  : sinkIDRaw === 'default' ? null : sinkIDRaw,
			voiceID : util.getSelectValue( 'audio-voiceID' ) ?? '',
		},
		send : {
			active : util.getFormCheck( 'send-active' ),
			blink  : util.getFormCheck( 'send-blink' ),
			combo  : util.getFormValue( 'send-combo' ) ?? '',
			eos    : util.getFormCheck( 'send-eos' ),
			switch : util.getFormCheck( 'send-switch' ),
			toggle : util.getFormCheck( 'send-toggle' ),
		},
		receive : {
			port : parseInt( util.getFormValue( 'receive-port' ) ?? '0', 10 ),
		},
	}
	window.ipc.saveSettings( settings )
}

// MARK: client buttons
function clientAddSwitch() {
	util.classAdd( 'click-add-switch', 'd-none' )
	const thisSwitch = document.createElement( 'div' )
	thisSwitch.innerHTML = SwitchConfigHTML( {
		id             : '',
		reset_switches : [],
		reverseColor   : false,
		speak          : '',
		textActive     : 'ON',
		textInactive   : 'OFF',
		title          : '',
	}, winStatus.switchList.length, true )
	thisSwitch.querySelector( '.action-btn[data-action="save-switch"]' )?.addEventListener( 'click', () => save_switch() )
	thisSwitch.querySelector( '.action-btn[data-action="reload"]' )?.addEventListener( 'click', () => window.ipc.config() )
	
	document.getElementById( 'toggle-config' )!.append( thisSwitch )
}

function clientAddTimer() {
	util.classAdd( 'click-add-timer', 'd-none' )
	const thisTimer = document.createElement( 'div' )
	thisTimer.innerHTML = TimerConfigHTML( {
		minutes          : null,
		reset_switches   : [],
		sound_countdowns : false,
		sound_extra      : '',
		target           : new Date(),
		title            : '',
		type             : 2,
	}, winStatus.timerCount, true )
	thisTimer.querySelector( '.action-btn[data-action="save-timer"]' )?.addEventListener( 'click', () => save_timer() )
	thisTimer.querySelector( '.action-btn[data-action="reload"]' )?.addEventListener( 'click', () => window.ipc.config() )
	
	thisTimer.querySelector( '.card' )?.classList.add( 'bg-primary-subtle' )

	for ( const element of thisTimer.querySelectorAll( 'select' ) ) {
		element.addEventListener( 'change', () => timer_details() )
	}

	document.getElementById( 'timer-config' )!.append( thisTimer )
	timer_details()
}

// MARK: Drag-n-Drop
export const dragDropFiles = () => {
	const dragTarget = util.getId( 'main-tab-content' )

	if ( dragTarget === null ) {
		return
	}

	dragTarget.addEventListener( 'dragover', ( ev ) => {
		ev.preventDefault()
	} )
	dragTarget.addEventListener( 'dragenter', ( ev ) => {
		if  ( ev.target === dragTarget ) {
			dragTarget.classList.add( 'bg-primary-subtle' )
		}
	} )
	dragTarget.addEventListener( 'dragleave', ( ev ) => {
		if ( ev.relatedTarget === null ) {
			dragTarget.classList.remove( 'bg-primary-subtle' )
		}
	} )
	dragTarget.addEventListener( 'drop', ( ev : DragEvent ) => {
		ev.preventDefault()
		dragTarget.classList.remove( 'bg-primary-subtle' )

		if ( ev.dataTransfer === null ) {
			return
		}

		const files = ev.dataTransfer.files

		let bg_class = 'bg-danger-subtle'

		if ( files !== null && files.length !== 0 ) {
			const file = files[0] // Access the first dropped file
			if ( file.type === 'application/json' ) {
				bg_class = 'bg-success-subtle'
				window.ipc.loadConfig( window.ipc.getFilePath( file ) )
			}
			
		}
		dragTarget.classList.add( bg_class )
		setTimeout( () => {
			dragTarget.classList.remove( bg_class )
		}, 1000 )
	} )
}