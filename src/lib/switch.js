
const SwitchStatus = Object.freeze({
	INACTIVE : 0,
	ACTIVE   : 1,
})

//MARK: Switch Class
class Switch {
	#audioFile    = null
	#isOn         = false
	#onText       = 'ON'
	#offText      = 'OFF'
	#title        = null
	#id           = null
	resetSwitches = []
	reverseColor  = false

	constructor(id, thisSwitch) {
		this.#id          = id
		this.#isOn        = thisSwitch?.isOn || false
		this.#title       = thisSwitch.title
		this.#audioFile   = thisSwitch?.audioFile || null
		this.reverseColor = thisSwitch?.reverseColor || false

		if ( typeof thisSwitch?.resetSwitches === 'object' ) { this.resetSwitches = thisSwitch.resetSwitches }

		this.#onText  = thisSwitch?.onText || 'ON'
		this.#offText = thisSwitch?.offText || 'OFF'
	}

	get title() { return this.#title }
	get isOn()  { return this.#isOn }
	get audio() { return this.#audioFile }
	
	on()  { this.#isOn = true  }
	off() { this.#isOn = false }

	serialize() {
		return {
			audioFile      : this.#audioFile,
			id             : this.#id,
			isOn           : this.#isOn,
			offText        : this.#offText,
			onText         : this.#onText,
			resetSwitches  : this.resetSwitches,
			reverseColor   : this.reverseColor,
			title          : this.#title,
		}
	}
}