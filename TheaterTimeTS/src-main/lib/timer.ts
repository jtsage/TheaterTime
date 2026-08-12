/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License
*/
import crypto from 'node:crypto'

const TimerStatus = Object.freeze({
	FINISHED : 2,
	PENDING  : 0,
	RUNNING  : 1,
})

const TimerType = Object.freeze({
	DOWN      : 2,
	MINUTES   : 3,
	UNDEFINED : 0,
	UP        : 1,
})

type TimerDef = {
	minutes          : number | null;
	reset_switches   : string[] | null;
	sound_countdowns : boolean;
	sound_extra      : string;
	target           : Date | null;
	title            : string | null;
	type             : number;
}

type TimerDefStatus = {
	dateStarted       : Date | null;
	dateStopped       : Date | null;
	formatTime       ?: string;
	reset_switches    : string[] | null;
	sound_countdowns  : boolean;
	sound_extra       : string;
	status            : number;
	title             : string | null;
	type              : number;
	wholeSeconds     ?: number;
}

type TimerDefUpdate = {
	uuid    : string | null;
	status  : number;
	speak  ?: string | null;
}

type TimerDefOSC = TimerDefUpdate & {
	formatTime   ?: string;
	title         : string | null;
	type          : number;
	wholeSeconds ?: number;
}

class TimerStack {
	#stack : Array<TimerInterface> = []
	#init : boolean                = false
	current_timer : number         = -1

	constructor() {
		this.current_timer = 0
	}

	add_stack(stack : Array<Partial<TimerDef>>) {
		if (Array.isArray(stack)) {
			for (const timer of stack) {
				this.add(timer)
			}
		}
		this.#init = true
		return this.#stack.length
	}

	remove(index : number) {
		this.#stack.splice(index, 1)
	}

	add({
		title            = null,
		reset_switches   = null,
		sound_countdowns = false,
		sound_extra      = '',
		target           = null,
		minutes          = null,
		type             = TimerType.UNDEFINED,
	} : Partial<TimerDef> = {}) {
		switch (type) {
			case TimerType.UP :
				this.#stack.push(new TimerUp(title, reset_switches))
				break
			case TimerType.DOWN :
				this.#stack.push(new TimerDown(title, target, sound_countdowns, reset_switches, sound_extra))
				break
			case TimerType.MINUTES :
				this.#stack.push(new TimerMinutes(title, minutes, sound_countdowns, reset_switches, sound_extra))
				break
			default :
				break
		}
		this.#init = true
		return this.#stack.length
	}

	clear() {
		this.#stack.length = 0
		this.#init = false
	}

	stop_all() {
		if ( !this.#init ) { return }
		for (const timer of this.#stack) {
			if (timer.isRunning) { timer.stop() }
		}
	}

	reset_all() {
		if ( !this.#init ) { return }
		for (const timer of this.#stack) {
			timer.reset()
		}
		this.current_timer = 0
	}

	next() {
		if ( !this.#init ) { return }
		if ( this.current_timer >= this.#stack.length ) { return }
		this.#stack?.[this.current_timer]?.stop()
		this.current_timer++
		if ( this.current_timer < this.#stack.length ) {
			this.#stack[this.current_timer].start()
		}
	}

	previous() {
		if ( !this.#init ) { return }
		this.#stack?.[this.current_timer]?.stop()
		if ( this.current_timer > 0 ) {
			this.current_timer--
			this.#stack[this.current_timer].start()
		}
	}

	force_today() {
		const today = new Date()
		for (const timer of this.#stack) {
			if ( timer.type === TimerType.DOWN ) {
				timer.targetDateTime = new Date(
					today.getFullYear(),
					today.getMonth(),
					today.getDate(),
					timer.targetDateTime?.getHours() ,
					timer.targetDateTime?.getMinutes(),
					0,
					0
				)
			}
		}
	}

	get current() {
		return this.#init ?
			this.#stack[this.current_timer]?.serialize || null :
			null
	}

	get osc() {
		return this.#init ?
			this.#stack[this.current_timer]?.osc || null :
			null
	}

	get all() {
		return this.#init ?
			this.#stack.map((timer) => timer.serialize) :
			[]
	}

	get update() {
		return this.#stack
			.filter((timer) => timer.status === TimerStatus.RUNNING)
			.map((timer) => timer.update)
	}

	get config() {
		return this.#stack.map((timer) => timer.config)
	}
}


interface TimerInterface {
	dateStopped : Date | null;
	dateStarted : Date | null;

	targetDateTime : Date | null;
	targetMinutes  : number | null;
	
	sound_countdowns : boolean;
	sound_extra      : string;

	reset_switches : string[] | null;

	status : number;
	type   : number;

	title : string | null;
	uuid  : string | null;

	isComplete : boolean;
	isRunning  : boolean;

	config    : TimerDef;
	osc       : TimerDefOSC;
	serialize : TimerDefStatus;
	update    : TimerDefUpdate;
	time     ?: number;

	start() : void;
	stop() : void;
	reset() : void;
	formatTime(dir : string, value : number, flip ?: boolean ) : string;
	timeAudio(time : number, extra: string) : string | null;
}

// MARK: Timer Parent
class TimerSTD implements TimerInterface {
	dateStopped : Date | null = null;
	dateStarted : Date | null = null;

	targetDateTime : Date | null = null;
	targetMinutes  : number | null = null;
	
	sound_countdowns : boolean = false
	sound_extra : string       = ''

	reset_switches : string[] = []

	status : number = TimerStatus.PENDING
	type : number   = TimerType.UNDEFINED

	title : string | null = null
	uuid : string | null  = null

	get isComplete() {
		return this.status === TimerStatus.FINISHED
	}

	get isRunning() {
		return this.status === TimerStatus.RUNNING
	}

	start() {
		this.status      = TimerStatus.RUNNING
		this.dateStarted = new Date()
	}

	stop() {
		this.status      = TimerStatus.FINISHED
		this.dateStopped = new Date()
	}

	reset() {
		this.status = TimerStatus.PENDING
		this.dateStarted = null
		this.dateStopped = null
	}

	constructor(title : string | null, reset_switches: string[] | null) {
		this.title          = title
		this.uuid           = crypto.randomUUID()
		this.reset_switches = Array.isArray(reset_switches) ? reset_switches : []
	}
	
	#dateOrNull(value : any) {
		if ( typeof value?.toISOString !== 'function' ) { return null }
		return value.toISOString()
	}

	formatTime(dir : string, value : number, flip : boolean = false) {
		const sign = value === 0 ? '' : (value < 0 || value > 0 && flip) ? '+ ' : '- '
		const total = Math.abs(value)
		const hours = Math.floor(total / (60*60))
		const minutes = Math.floor((total - (hours*60*60)) / 60)
		const seconds = Math.floor(total % 60)
		return `${dir}${sign}${this.#zPad(hours)}:${this.#zPad(minutes)}:${this.#zPad(seconds)}`
	}

	#zPad(num : number) {
		return num.toString().padStart(2, '0')
	}

	get serialize() {
		return {
			dateStarted      : this.#dateOrNull(this.dateStarted),
			dateStopped      : this.#dateOrNull(this.dateStopped),
			dateTarget       : this.#dateOrNull(this.targetDateTime),
			reset_switches   : this.reset_switches,
			sound_countdowns : this.sound_countdowns,
			sound_extra      : this.sound_extra,
			status           : this.status,
			title            : this.title,
			type             : this.type,
			uuid             : this.uuid,
		}
	}

	get osc() { return { type : this.type, title : this.title, ...this.update } }
	get update() { return { uuid : this.uuid, status : this.status } }

	timeAudio(time : number, extra: string) {
		const timeString = this.#timeAudio(time)
		return timeString !== null
			? extra !== '' ? `${extra}. ${timeString}` : timeString
			: null
	}

	#timeAudio(time : number) {
		switch ( time ) {
			case 5400 : return 'Hour before half hour please. 90 Minutes.'
			case 3600 : return 'One Hour Please.  One Hour.'
			case 1800 : return 'Thirty Minutes Please.  Thirty Minutes.'
			case 1200 : return 'Twenty Minutes Please.  Twenty Minutes.'
			case 900  : return 'Fif-teen Minutes Please.  Fif-teen Minutes.'
			case 600  : return 'Ten Minutes Please.  Ten Minutes.'
			case 300  : return 'Five Minutes Please.  Five Minutes.'
			default   : return null
		}
	}

	get config() {
		return {
			minutes          : this.type === TimerType.MINUTES ? this.targetMinutes : null,
			reset_switches   : this.reset_switches,
			sound_countdowns : this.sound_countdowns,
			sound_extra      : this.sound_extra,
			target           : this.type === TimerType.DOWN ? this.targetDateTime   : null,
			title            : this.title,
			type             : this.type,
		}
	}
}

// MARK: TimerCountUp
class TimerUp extends TimerSTD implements TimerInterface {
	constructor(title: string | null, reset_switches : string[] | null = null) {
		super(title, reset_switches)
		this.type = TimerType.UP
	}

	get time() {
		switch (this.status) {
			case TimerStatus.PENDING : return 0
			case TimerStatus.FINISHED : {
				if ( this.dateStarted === null || this.dateStopped === null ) {
					return 0
				}
				return Math.floor((this.dateStopped.getTime() - this.dateStarted.getTime()) / 1000)
			}
			default : {
				if ( this.dateStarted === null ) { return 0 }
				return Math.floor(((new Date()).getTime() - this.dateStarted.getTime()) / 1000)
			}
		}
	}

	get serialize() {
		const time = this.time
		const dir = this.status === TimerStatus.RUNNING ? '↑ ' : ''
		return {
			wholeSeconds : time,
			formatTime   : this.formatTime(dir, time, true),
			...super.serialize,
		}
	}

	get update() {
		const time = this.time
		const dir = this.status === TimerStatus.RUNNING ? '↑ ' : ''
		return {
			formatTime   : this.formatTime(dir, time, true),
			speak        : null,
			wholeSeconds : time,
			...super.update,
		}
	}
}

// MARK: TimerCountDown
class TimerMinutes extends TimerSTD implements TimerInterface {
	constructor(title : string | null, minutes : number | null, sound_countdowns : boolean = false, reset_switches : string[] | null = null, sound_extra : string = '') {
		super(title, reset_switches)
		this.targetMinutes    = minutes
		this.sound_countdowns = sound_countdowns
		this.sound_extra      = sound_extra
		this.type             = TimerType.MINUTES
	}

	start() {
		this.targetDateTime = new Date()
		if ( this.targetMinutes !== null ) {
			this.targetDateTime.setMinutes(this.targetDateTime.getMinutes() + this.targetMinutes)
		}
		this.targetDateTime.setSeconds(this.targetDateTime.getSeconds() + 2)
		super.start()
	}

	reset() {
		this.targetDateTime = null
		super.reset()
	}

	get time() {
		switch (this.status) {
			case TimerStatus.PENDING : return (this.targetMinutes || 0)  * 60
			case TimerStatus.RUNNING : {
				if ( this.targetDateTime === null ) { return 0 }
				return Math.floor((this.targetDateTime.getTime() - (new Date()).getTime()) / 1000)
			}
			case TimerStatus.FINISHED : {
				if ( this.dateStarted === null || this.dateStopped === null ) { return 0 }
				return Math.floor((this.dateStopped.getTime() - this.dateStarted.getTime()) / 1000)
			}
			default : return 0
		}
	}

	get serialize() {
		const time = this.time
		const dir = this.status === TimerStatus.RUNNING ? '↓ ' : ''
		return {
			wholeSeconds : time,
			formatTime   : this.formatTime(dir, time),
			...super.serialize,
		}
	}

	get update() {
		const time = this.time
		const dir = this.status === TimerStatus.RUNNING ? '↓ ' : ''
		return {
			formatTime   : this.formatTime(dir, time),
			speak        : this.sound_countdowns ? super.timeAudio(time, this.sound_extra) : null,
			wholeSeconds : time,
			...super.update,
		}
	}
}

// MARK: TimerABSCountDown
class TimerDown extends TimerSTD implements TimerInterface {
	constructor(title : string | null, target : any, sound_countdowns : boolean = false, reset_switches : string[] | null = null, sound_extra : string = '') {
		super(title, reset_switches)

		if ( target instanceof Date ) {
			this.targetDateTime   = target
		} else {
			this.targetDateTime   = new Date(target)
		}

		this.sound_extra      = sound_extra
		this.sound_countdowns = sound_countdowns
		this.type             = TimerType.DOWN

		this.start()
	}

	reset() {
		super.reset()
		this.start()
	}

	get time() {
		switch (this.status) {
			case TimerStatus.PENDING : return 0
			case TimerStatus.FINISHED : {
				if ( this.targetDateTime === null || this.dateStopped === null ) { return 0 }
				return Math.floor((this.targetDateTime.getTime() - this.dateStopped.getTime()) / 1000)
			}
			default : {
				if ( this.targetDateTime === null ) { return 0 }
				return Math.floor((this.targetDateTime.getTime() - (new Date()).getTime()) / 1000)
			}
		}
	}

	get serialize() {
		const time = this.time
		const dir = this.status === TimerStatus.RUNNING ? '↓ ' : ''
		return {
			wholeSeconds : time,
			formatTime   : this.formatTime(dir, time),
			...super.serialize,
		}
	}

	get update() {
		const time = this.time
		const dir = this.status === TimerStatus.RUNNING ? '↓ ' : ''
		return {
			...super.update,
			formatTime   : this.formatTime(dir, time),
			speak        : this.sound_countdowns
				? super.timeAudio(time, this.sound_extra)
				: null,
			wholeSeconds : time,
		}
	}
}

const today_time = (hour: number, minute: number) => {
	const now = new Date()
	now.setSeconds(0)
	now.setMilliseconds(0)
	now.setHours(hour)
	now.setMinutes(minute)
	return now
}

const DefaultShow = () => [
	{
		minutes          : null,
		reset_switches   : null,
		sound_countdowns : true,
		target           : today_time(19, 30),
		title            : 'Pre-Show',
		type             : TimerType.DOWN,
	},
	{
		minutes          : null,
		reset_switches   : null,
		sound_countdowns : false,
		target           : null,
		title            : 'Act I',
		type             : TimerType.UP,
	},
	{
		minutes          : 15,
		reset_switches   : ['switch-places'],
		sound_countdowns : true,
		target           : null,
		title            : 'Intermission',
		type             : TimerType.MINUTES,
	},
	{
		minutes          : null,
		reset_switches   : null,
		sound_countdowns : false,
		target           : null,
		title            : 'Act II',
		type             : TimerType.UP,
	},
]

const DefaultRehearsal = () => [
	{
		minutes          : null,
		reset_switches   : null,
		sound_countdowns : true,
		target           : today_time(17, 0),
		title            : 'Rehearsal Start',
		type             : TimerType.DOWN,
	},
	{
		minutes          : null,
		reset_switches   : null,
		sound_countdowns : false,
		target           : today_time(22, 0),
		title            : 'Rehearsal End',
		type             : TimerType.DOWN,
	},
]

const DefaultEmpty = () => [
	{
		minutes          : null,
		reset_switches   : null,
		sound_countdowns : true,
		target           : today_time(12, 0),
		title            : 'Timer',
		type             : TimerType.DOWN,
	},
]

export { TimerStack, TimerDef }
export default {
	Stack  : TimerStack,
	Status : TimerStatus,
	Type   : TimerType,

	DefaultEmpty     : DefaultEmpty,
	DefaultRehearsal : DefaultRehearsal,
	DefaultShow      : DefaultShow,
}