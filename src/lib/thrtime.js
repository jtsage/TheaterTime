/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License
*/

const Timers   = require('./timer.js')
const Switches = require('./switch.js')

class DataStack {
	audioStack = []
	timers = null
	toggle = null
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
		for ( const timer of timers ) {
			if ( timer.audio !== null ) { this.audioStack.push(timer.audio) }
		}
		return {
			timers : timers,
			playAudio : this.audioStack.shift(),
		}
	}

	toggleSwitch(index) {
		const audio = this.toggle.toggle(index)
		if ( audio !== null ) { this.audioStack.push(audio) }
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