/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License
*/

const Timers   = require('./timer.js')
const Switches = require('./switch.js')

class DataStack {
	timers = null
	toggle = null

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
		}
	}
}

module.exports = {
	Stack  : DataStack,
}