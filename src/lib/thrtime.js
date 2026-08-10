/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License
*/

import Timers   from './timer.js'
import Switches from './switch.js'

const DataDefaultSettings = {
	audio   : {
		enabled : true,
		sinkID  : null,
		voiceID : 'kronk-medium',
	},
	receive : {
		port : 4488,
	},
	send  : {
		combo : '127.0.0.1:4444',

		active : true,
		blink  : true,
		eos    : true,
		switch : true,
		toggle : true,
	},
}

class DataStack {
	speakStack  = []
	logStack    = []
	timers      = null
	toggle      = null
	settings    = DataDefaultSettings

	constructor() {
		this.timers = new Timers.Stack()
		this.toggle = new Switches.Stack()

		this.timers.add_stack(Timers.DefaultShow())
		this.toggle.add_stack(Switches.Default)
	}

	log(process, text, level) {
		const now = new Date()
		this.logStack.push([process, text, level, now.toLocaleTimeString()])
	}

	get voices() {
		return [
			'cortana',
			'en_US-hfc_female-medium',
			'en_US-hfc_male-medium',
			'glados',
			'kronk-medium',
		]
	}
	get config() {
		return {
			settings    : this.settings,
			timers      : this.timers.config,
			toggle      : this.toggle.config,
		}
	}

	defaultShow() {
		this.timers.clear()
		this.timers.add_stack(Timers.DefaultShow())
		this.toggle.clear()
		this.toggle.add_stack(Switches.Default)
	}

	defaultRehearsal() {
		this.timers.clear()
		this.timers.add_stack(Timers.DefaultRehearsal())
		this.toggle.clear()
		this.toggle.add_stack(Switches.Rehearsal)
	}

	defaultEmpty() {
		this.timers.clear()
		this.timers.add_stack(Timers.DefaultEmpty())
		this.toggle.clear()
	}

	set config(newConfig) {
		this.settings = newConfig.settings
		this.timers.clear()
		this.timers.add_stack(newConfig.timers)
		this.toggle.clear()
		this.toggle.add_stack(newConfig.toggle)
	}

	get status() {
		return {
			current_timer : this.timers.current_timer,
			timers        : this.timers.all,
			toggle        : this.toggle.all,
		}
	}

	get update() {
		const timers = this.timers.update
		for ( const timer of timers ) {
			if ( timer.speak !== null ) { this.speakStack.push(timer.speak) }
		}
		return {
			timers : timers,
			spoken : this.speakStack.shift(),
		}
	}

	oscToggleSwitch(number) {
		if ( typeof number !== 'number' || !Number.isInteger(number) ) { return }
		const speak = this.toggle.toggle(number - 1)
		if ( speak !== null && speak !== '' ) { this.speakStack.push(speak) }
	}

	oscOffSwitch(number) {
		if ( typeof number !== 'number' || !Number.isInteger(number) ) { return }
		const speak = this.toggle.off(number - 1)
		if ( speak !== null && speak !== '' ) { this.speakStack.push(speak) }
	}

	oscOnSwitch(number) {
		if ( typeof number !== 'number' || !Number.isInteger(number) ) { return }
		const speak = this.toggle.on(number - 1)
		if ( speak !== null && speak !== '' ) { this.speakStack.push(speak) }
	}

	toggleSwitch(index) {
		if ( isNaN(index) ) { return }
		const speak = this.toggle.toggle(index)
		if ( speak !== null && speak !== '' ) { this.speakStack.push(speak) }
	}

	reset_all() {
		this.timers.reset_all()
		this.toggle.reset_all()
	}

	next_timer() {
		this.timers.next()
		if ( Array.isArray(this.timers.current?.reset_switches) ) {
			for ( const reset of this.timers.current.reset_switches ) {
				this.toggle.force_off(reset)
			}
		}
	}

	saveSettings(settings) {
		this.settings = settings
		this.logOutputPath()
	}

	logOutputPath() {
		this.log('main', 'settings updated.', 0)
		for ( const paired of this.settings.send.combo.split(',') ) {
			const parts = paired.split(':')
			this.log('main', `send path added: ${parts[0]}:${parts[1]}`, 2)
		}
	}

	set safe_load(newConfig) {
		for (const key of Object.keys(DataDefaultSettings.audio)) {
			if ( ! Object.hasOwn(newConfig.settings.audio, key) ) {
				this.log('main', `Default value for audio.${key} used (${DataDefaultSettings.audio[key]})`, 0)
				newConfig.settings.audio[key] = DataDefaultSettings.audio[key]
			}
		}
		for (const key of Object.keys(DataDefaultSettings.receive)) {
			if ( ! Object.hasOwn(newConfig.settings.receive, key) ) {
				this.log('main', `Default value for receive.${key} used (${DataDefaultSettings.receive[key]})`, 0)
				newConfig.settings.receive[key] = DataDefaultSettings.receive[key]
			}
		}
		for (const key of Object.keys(DataDefaultSettings.send)) {
			if ( ! Object.hasOwn(newConfig.settings.send, key) ) {
				this.log('main', `Default value for send.${key} used (${DataDefaultSettings.send[key]})`, 0)
				newConfig.settings.send[key] = DataDefaultSettings.send[key]
			}
		}
		this.settings = newConfig.settings
		this.timers.clear()
		this.timers.add_stack(newConfig.timers)
		this.toggle.clear()
		this.toggle.add_stack(newConfig.toggle)
		this.logOutputPath()
	}
}

export default {
	Stack  : DataStack,
}