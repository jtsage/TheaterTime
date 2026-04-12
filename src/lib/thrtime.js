/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License
*/

const Timers   = require('./timer.js')
const Switches = require('./switch.js')

class DataStack {
	speakStack  = []
	log         = []
	timers      = null
	toggle      = null
	settings    = {
		audio : true,
		send  : {
			host : '127.0.0.1',
			port : 4444,

			active : true,
			blink  : true,
			switch : true,
			toggle : true,
		},
		receive : {
			port : 4488,
		},
	}

	constructor() {
		this.timers = new Timers.Stack()
		this.toggle = new Switches.Stack()

		this.timers.add_stack(Timers.DefaultShow)
		this.toggle.add_stack(Switches.Default)
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
		this.timers.add_stack(Timers.DefaultShow)
		this.toggle.clear()
		this.toggle.add_stack(Switches.Default)
	}

	defaultRehearsal() {
		this.timers.clear()
		this.timers.add_stack(Timers.DefaultRehearsal)
		this.toggle.clear()
		this.toggle.add_stack(Switches.Rehearsal)
	}

	defaultEmpty() {
		this.timers.clear()
		this.timers.add_stack(Timers.DefaultEmpty)
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
			timers : this.timers.all,
			toggle : this.toggle.all,
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

	toggleSwitch(index) {
		const speak = this.toggle.toggle(index)
		if ( speak !== null && speak !== '' ) { this.speakStack.push(speak) }
	}

	reset_all() {
		this.timers.reset_all()
		this.toggle.reset_all()
	}

	next_timer() {
		this.timers.next()
		for ( const reset of this.timers.current.reset_switches ) {
			this.toggle.force_off(reset)
		}
	}

	saveSettings(settings) {
		this.settings = settings
	}
}

module.exports = {
	Stack  : DataStack,
}