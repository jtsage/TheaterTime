/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License
*/

const SwitchStatus = Object.freeze({
	INACTIVE : 0,
	ACTIVE   : 1,
});

type SwitchDef = {
	reset_switches : string[] | null;
	reverseColor   : boolean;
	speak          : string | null;
	textActive     : string;
	textInactive   : string;
	title          : string;
}

type SwitchDefConfig = SwitchDef & {
	id : string;
}

type SwitchDefSerial = SwitchDef & {
	id : string;
	status : number;
}


interface SwitchInterface {
	id : string | null;
	reset_switches : string[];
	reverseColor :boolean;
	speak : string | null;
	status : number;
	textActive : string;
	textInactive : string;
	title : string | null;

	on() : void;
	off() : void;
	isOn : boolean;
	serialize : SwitchDefSerial;
	config : SwitchDefConfig;

}

//MARK: Switch Class
class Switch implements SwitchInterface {
	id : string               = 'unassigned';
	reset_switches : string[] = [];
	reverseColor :boolean     = false;
	speak : string | null     = null;
	status : number           = SwitchStatus.INACTIVE;
	textActive : string       = '';
	textInactive : string     = '';
	title : string            = '';

	constructor({
		title          = '',
		reset_switches = null,
		reverseColor   = false,
		speak          = null,
		textActive     = 'ON',
		textInactive   = 'OFF',
	}: Partial<SwitchDef> = {}) {
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

interface SwitchStackInterface {
	// all : Array<Switch>
	add_stack(stack : Array<SwitchDef>) : number;
	add(arg0: Partial<SwitchDef>)       : number;
	clear()                             : void;
	force_off(id: string)               : void;
	off(index: number)                  : void;
	on(index: number)                   : void;
	remove(index : number)              : void;
	reset_all()                         : void;
	toggle(index: number)               : void;
}

class SwitchStack implements SwitchStackInterface {
	#stack : Array<SwitchInterface>  = []

	add_stack(stack: Array<SwitchDef>) {
		if (Array.isArray(stack)) {
			for (const toggle of stack) {
				this.add(toggle)
			}
		}
		return this.#stack.length
	}

	remove(index : number) {
		this.#stack.splice(index, 1)
	}

	add({
		title,
		speak          = null,
		reset_switches = null,
		reverseColor   = false,
		textActive     = 'ON',
		textInactive   = 'OFF',
	}: Partial<SwitchDef> = {}) {
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

	on(index : number) {
		this.#stack[index].on()
		for ( const reset of this.#stack[index].reset_switches ) {
			this.force_off(reset)
		}
		return this.#stack[index].speak
	}

	off(index : number) {
		this.#stack[index].off()
		return null
	}

	force_off(id : string) {
		for ( const toggle of this.#stack ) {
			if ( toggle.id === id ) {
				toggle.off()
			}
		}
	}

	toggle(index : number) {
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

const DefaultShow : Array<SwitchDef> = [
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

const DefaultRehearsal : Array<SwitchDef> = [
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
		textActive     : 'Wigs & Makeup ARE Ready',
		textInactive   : 'Wigs & Makeup are NOT Ready',
		title          : 'Wigs & Makeup',
	},
]

export { SwitchInterface, SwitchStackInterface, SwitchStack }
export default {
	Stack  : SwitchStack,
	Status : SwitchStatus,

	Default : DefaultShow,
	Rehearsal : DefaultRehearsal,
}