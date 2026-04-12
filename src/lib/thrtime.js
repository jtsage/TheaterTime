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
	timers      = null
	toggle      = null
	connections = {
		send : {
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
			timers : this.timers.config,
			toggle : this.toggle.config,
			connections : this.connections,
		}
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
		console.log(timers)
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
}

module.exports = {
	Stack  : DataStack,
}