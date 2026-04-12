/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License
*/

const SwitchStatus = Object.freeze({
	INACTIVE : 0,
	ACTIVE   : 1,
})

//MARK: Switch Class
class Switch {
	id             = null
	reset_switches = []
	reverseColor   = false
	speak          = null
	status         = SwitchStatus.INACTIVE
	textActive     = ''
	textInactive   = ''
	title          = null

	constructor({
		title,
		reset_switches = null,
		reverseColor   = false,
		speak          = null,
		textActive     = 'ON',
		textInactive   = 'OFF',
	} = {}) {
		this.id             = `switch-${title.toLowerCase().replace(/[^\dA-Za-z]/, '-')}`

		this.speak          = speak
		this.title          = title
		this.textActive     = textActive
		this.textInactive   = textInactive
		this.reverseColor   = reverseColor
		this.reset_switches = Array.isArray(reset_switches) ? reset_switches : []
	}

	on()  { this.status = SwitchStatus.ACTIVE }
	off() { this.status = SwitchStatus.INACTIVE }

	get isOn() { return this.status === SwitchStatus.ACTIVE }

	get serialize() {
		return {
			id             : this.id,
			reset_switches : this.reset_switches,
			reverseColor   : this.reverseColor,
			speak          : this.speak,
			status         : this.status,
			textActive     : this.textActive,
			textInactive   : this.textInactive,
			title          : this.title,
		}
	}

	get config() {
		return {
			id             : this.id,
			reset_switches : this.reset_switches,
			reverseColor   : this.reverseColor,
			speak          : this.speak,
			textActive     : this.textActive,
			textInactive   : this.textInactive,
			title          : this.title,
		}
	}
}


class SwitchStack {
	#stack        = []

	add_stack(stack) {
		if (Array.isArray(stack)) {
			for (const toggle of stack) {
				this.add(toggle)
			}
		}
		return this.#stack.length
	}

	remove(index) {
		this.#stack.splice(index, 1)
	}

	add({
		title,
		speak          = null,
		reset_switches = null,
		reverseColor   = false,
		textActive     = 'ON',
		textInactive   = 'OFF',
	} = {}) {
		this.#stack.push(new Switch({
			reset_switches : reset_switches,
			reverseColor   : reverseColor,
			speak          : speak,
			textActive     : textActive,
			textInactive   : textInactive,
			title          : title,
		}))
		return this.#stack.length
	}

	clear() {
		this.#stack.length = 0
	}

	reset_all() {
		for (const toggle of this.#stack) {
			if (toggle.isOn) { toggle.off() }
		}
	}

	on(index) {
		this.#stack[index].on()
		for ( const reset of this.#stack[index].reset_switches ) {
			this.force_off(reset)
		}
		return this.#stack[index].speak
	}

	off(index) {
		this.#stack[index].off()
		return null
	}

	force_off(id) {
		for ( const toggle of this.#stack ) {
			if ( toggle.id === id ) {
				toggle.off()
			}
		}
	}

	toggle(index) {
		if ( this.#stack[index].isOn ) {
			return this.off(index)
		}
		return this.on(index)
	}

	get all() {
		return this.#stack.map((toggle) => toggle.serialize)
	}

	get config() {
		return this.#stack.map((toggle) => toggle.config)
	}
}

const DefaultShow = [
	{
		reset_switches : null,
		reverseColor   : false,
		speak          : 'Microphones are now ready.',
		textActive     : 'Microphones ARE Ready',
		textInactive   : 'Microphones are NOT Ready',
		title          : 'Microphones',
	},
	{
		reset_switches : null,
		reverseColor   : false,
		speak          : 'The House is now open.',
		textActive     : 'House is OPEN',
		textInactive   : 'House is NOT Open',
		title          : 'House',
	},
	{
		reset_switches : ['switch-house-hold'],
		reverseColor   : false,
		speak          : 'Places please.  Places.  Thank You.',
		textActive     : 'Places HAS been called',
		textInactive   : 'Places has NOT been called',
		title          : 'Places',
	},
	{
		reset_switches : null,
		reverseColor   : true,
		speak          : 'A house hold is required.  Please stand by.',
		textActive     : 'House Hold is REQUIRED',
		textInactive   : 'House Hold is NOT Needed',
		title          : 'House Hold',
	}
]

const DefaultRehearsal = [
	{
		reset_switches : null,
		reverseColor   : false,
		speak          : 'Microphones are now ready.',
		textActive     : 'Microphones ARE Ready',
		textInactive   : 'Microphones are NOT Ready',
		title          : 'Microphones',
	},
	{
		reset_switches : null,
		reverseColor   : false,
		speak          : 'Costumes are now ready.',
		textActive     : 'Costumes ARE Ready',
		textInactive   : 'Costumes are NOT Ready',
		title          : 'Costumes',
	},
	{
		reset_switches : null,
		reverseColor   : false,
		speak          : 'Wigs and Makeup are now ready.',
		textActive     : 'Wigs &amp; Makeup ARE Ready',
		textInactive   : 'Wigs &amp; Makeup are NOT Ready',
		title          : 'Wigs &amp; Makeup',
	},
]


module.exports = {
	Stack  : SwitchStack,
	Status : SwitchStatus,

	Default : DefaultShow,
	Rehearsal : DefaultRehearsal,
}