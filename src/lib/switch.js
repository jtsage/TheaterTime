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
	audioFile      = null
	id             = null
	reset_switches = []
	reverseColor   = false
	status         = SwitchStatus.INACTIVE
	textActive     = ''
	textInactive   = ''
	title          = null

	constructor({
		title,
		audioFile      = null,
		reset_switches = null,
		reverseColor   = false,
		textActive     = 'ON',
		textInactive   = 'OFF',
	} = {}) {
		this.id             = `switch-${title.toLowerCase().replace(/[^\dA-Za-z]/, '-')}`

		this.audioFile      = audioFile
		this.title          = title
		this.textActive     = textActive
		this.textInactive   = textInactive
		this.reverseColor   = reverseColor
		this.reset_switches = Array.isArray(reset_switches) ? reset_switches : []
	}

	on() { this.status = SwitchStatus.ACTIVE }
	off() { this.status = SwitchStatus.INACTIVE }

	get isOn() { return this.status === SwitchStatus.ACTIVE }

	get serialize() {
		return {
			audioFile      : this.audioFile,
			id             : this.id,
			reset_switches : this.reset_switches,
			reverseColor   : this.reverseColor,
			status         : this.status,
			textActive     : this.textActive,
			textInactive   : this.textInactive,
			title          : this.title,
		}
	}

	get config() {
		return {
			audioFile      : this.audioFile,
			id             : this.id,
			reset_switches : this.reset_switches,
			reverseColor   : this.reverseColor,
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

	add({
		title,
		audioFile      = null,
		reset_switches = null,
		reverseColor   = false,
		textActive     = 'ON',
		textInactive   = 'OFF',
	} = {}) {
		this.#stack.push(new Switch({
			audioFile      : audioFile,
			reset_switches : reset_switches,
			reverseColor   : reverseColor,
			textActive     : textActive,
			textInactive   : textInactive,
			title          : title,
		}))
		return this.#stack.length
	}

	clear() {
		this.#stack.length = 0
	}

	reset() {
		for (const toggle of this.#stack) {
			if (toggle.isOn) { toggle.off() }
		}
	}

	on(index) {
		this.#stack[index].on()
	}

	off(index) {
		this.#stack[index].off()
	}

	get all() {
		return this.#stack.map((toggle) => toggle.serialize)
	}

	get config() {
		return this.#stack.map((toggle) => toggle.config)
	}
}

const SwitchDefault = [
	{
		audioFile      : 'mics.wav',
		reset_switches : null,
		reverseColor   : false,
		textActive     : 'Microphones ARE Ready',
		textInactive   : 'Microphones are NOT Ready',
		title          : 'Microphones',
	},
	{
		audioFile      : 'house.wav',
		reset_switches : null,
		reverseColor   : false,
		textActive     : 'House is OPEN',
		textInactive   : 'House is NOT Open',
		title          : 'House',
	},
	{
		audioFile      : 'places.wav',
		reset_switches : ['switch-house-hold'],
		reverseColor   : false,
		textActive     : 'Places HAS been called',
		textInactive   : 'Places has NOT been called',
		title          : 'Places',
	},
	{
		audioFile      : 'mics.wav',
		reset_switches : null,
		reverseColor   : true,
		textActive     : 'House Hold is REQUIRED',
		textInactive   : 'House Hold is NOT Needed',
		title          : 'House Hold',
	}
]


module.exports = {
	Stack  : SwitchStack,
	Status : SwitchStatus,

	Default : SwitchDefault,
}