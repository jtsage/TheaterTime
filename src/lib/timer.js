/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License
*/
const crypto = require('node:crypto')

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

class TimerStack {
	#stack        = []
	#init         = false
	current_timer = -1

	constructor() {
		this.current_timer = 0
	}

	add_stack(stack) {
		if (Array.isArray(stack)) {
			for (const timer of stack) {
				this.add(timer)
			}
		}
		this.#init = true
		return this.#stack.length
	}

	remove(index) {
		this.#stack.splice(index, 1)
	}

	add({
		title          = null,
		reset_switches = null,
		use_sound      = false,
		target         = null,
		minutes        = null,
		type           = TimerType.UNDEFINED,
	} = {}) {
		switch (type) {
			case TimerType.UP :
				this.#stack.push(new TimerUp(title, reset_switches))
				break
			case TimerType.DOWN :
				this.#stack.push(new TimerDown(title, target, use_sound, reset_switches))
				break
			case TimerType.MINUTES :
				this.#stack.push(new TimerMinutes(title, minutes, use_sound, reset_switches))
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
		this.#stack[this.current_timer].stop()
		this.current_timer++
		if ( this.#stack.length > this.current_timer ) {
			this.#stack[this.current_timer].start()
		}
	}

	previous() {
		if ( !this.#init ) { return }
		this.#stack[this.current_timer].stop()
		if ( this.current_timer > 0 ) {
			this.current_timer--
			this.#stack[this.current_timer].start()
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


// MARK: Timer Parent
class TimerSTD {
	dateStopped = null
	dateStarted = null

	targetDateTime = null
	targetMinutes  = null
	
	sound_countdowns = false

	reset_switches = []

	status = TimerStatus.PENDING
	type   = TimerType.UNDEFINED

	title = null
	uuid  = null

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

	constructor(title, reset_switches) {
		this.title          = title
		this.uuid           = crypto.randomUUID()
		this.reset_switches = Array.isArray(reset_switches) ? reset_switches : []
	}
	
	#dateOrNull(value) {
		if ( typeof value?.toISOString !== 'function' ) { return null }
		return value.toISOString()
	}

	formatTime(dir, value, flip = false) {
		const sign = value === 0 ? '' : (value < 0 || value > 0 && flip) ? '+ ' : '- '
		const total = Math.abs(value)
		const hours = Math.floor(total / (60*60))
		const minutes = Math.floor((total - (hours*60*60)) / 60)
		const seconds = Math.floor(total % 60)
		return `${dir}${sign}${this.#zPad(hours)}:${this.#zPad(minutes)}:${this.#zPad(seconds)}`
	}
	#zPad(num) {
		return num.toString().padStart(2, '0')
	}

	get serialize() {
		return {
			dateStarted      : this.#dateOrNull(this.dateStarted),
			dateStopped      : this.#dateOrNull(this.dateStopped),
			dateTarget       : this.#dateOrNull(this.targetDateTime),
			reset_switches   : this.reset_switches,
			sound_countdowns : this.sound_countdowns,
			status           : this.status,
			title            : this.title,
			type             : this.type,
			uuid             : this.uuid,
		}
	}

	get osc() { return { type : this.type, title : this.title, ...this.update } }
	get update() { return { uuid : this.uuid, status : this.status } }

	timeAudio(time) {
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
			target           : this.type === TimerType.DOWN ? this.targetDateTime   : null,
			title            : this.title,
			type             : this.type,
		}
	}
}

// MARK: TimerCountUp
class TimerUp extends TimerSTD {
	constructor(title, reset_switches = null) {
		super(title, reset_switches)
		this.type = TimerType.UP
	}

	get time() {
		switch (this.status) {
			case TimerStatus.PENDING : return 0
			case TimerStatus.FINISHED : return Math.floor((this.dateStopped - this.dateStarted) / 1000)
			default : return Math.floor((new Date() - this.dateStarted) / 1000)
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
class TimerMinutes extends TimerSTD {
	constructor(title, minutes, use_sound = false, reset_switches = null) {
		super(title, reset_switches)
		this.targetMinutes    = minutes
		this.sound_countdowns = use_sound
		this.type             = TimerType.MINUTES
	}

	start() {
		this.targetDateTime = new Date()
		this.targetDateTime.setMinutes(this.targetDateTime.getMinutes() + this.targetMinutes)
		this.targetDateTime.setSeconds(this.targetDateTime.getSeconds() + 2)
		super.start()
	}

	reset() {
		this.targetDateTime = null
		super.reset()
	}

	get time() {
		switch (this.status) {
			case TimerStatus.PENDING : return this.targetMinutes * 60
			case TimerStatus.RUNNING : return Math.floor((this.targetDateTime - new Date()) / 1000)
			case TimerStatus.FINISHED : return Math.floor((this.dateStopped - this.dateStarted) / 1000)
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
			speak        : this.sound_countdowns ? super.timeAudio(time) : null,
			wholeSeconds : time,
			...super.update,
		}
	}
}

// MARK: TimerABSCountDown
class TimerDown extends TimerSTD {
	constructor(title, target, use_sound = false, reset_switches = null) {
		super(title, reset_switches)

		if ( target instanceof Date ) {
			this.targetDateTime   = target
		} else {
			this.targetDateTime   = new Date(target)
		}

		this.sound_countdowns = use_sound
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
			case TimerStatus.FINISHED : return Math.floor((this.targetDateTime - this.dateStopped) / 1000)
			default : return Math.floor((this.targetDateTime - new Date()) / 1000)
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
			speak        : this.sound_countdowns ? super.timeAudio(time) : null,
			wholeSeconds : time,
		}
	}
}

const today_time = (hour, minute) => {
	const now = new Date()
	now.setSeconds(0)
	now.setMilliseconds(0)
	now.setHours(hour)
	now.setMinutes(minute)
	return now
}

const DefaultShow = [
	{
		minutes        : null,
		reset_switches : null,
		target         : today_time(19, 30),
		title          : 'Pre-Show',
		type           : TimerType.DOWN,
		use_sound      : true,
	},
	{
		minutes        : null,
		reset_switches : null,
		target         : null,
		title          : 'Act I',
		type           : TimerType.UP,
		use_sound      : false,
	},
	{
		minutes        : 15,
		reset_switches : ['switch-places'],
		target         : null,
		title          : 'Intermission',
		type           : TimerType.MINUTES,
		use_sound      : true,
	},
	{
		minutes        : null,
		reset_switches : null,
		target         : null,
		title          : 'Act II',
		type           : TimerType.UP,
		use_sound      : false,
	},
]

const DefaultRehearsal = [
	{
		minutes        : null,
		reset_switches : null,
		target         : today_time(17, 0),
		title          : 'Rehearsal Start',
		type           : TimerType.DOWN,
		use_sound      : true,
	},
	{
		minutes        : null,
		reset_switches : null,
		target         : today_time(22, 0),
		title          : 'Rehearsal End',
		type           : TimerType.DOWN,
		use_sound      : false,
	},
]

const DefaultEmpty = [
	{
		minutes        : null,
		reset_switches : null,
		target         : today_time(12, 0),
		title          : 'Timer',
		type           : TimerType.DOWN,
		use_sound      : true,
	},
]

module.exports = {
	Stack  : TimerStack,
	Status : TimerStatus,
	Type   : TimerType,

	DefaultEmpty     : DefaultEmpty,
	DefaultRehearsal : DefaultRehearsal,
	DefaultShow      : DefaultShow,
}