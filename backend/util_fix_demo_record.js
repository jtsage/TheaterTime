/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2023 J.T.Sage - ISC License

	Demo Record
*/

const { Level } = require('level')
const db        = new Level('theaterTimeDB', { valueEncoding : 'json' })

const sample_start_time = new Date()
sample_start_time.setHours(19)
sample_start_time.setMinutes(30)
sample_start_time.setSeconds(0)
sample_start_time.setMilliseconds(0)

db.put('00sample00', {
	internals : {
		adminPass : 'cuteknot38',
		ipAddress : '127.0.0.1',
	},
	clientData : {
		info : {
			title    : 'Some Example Theater',
			subtitle : 'Some Example Show',
		},
		switches : [
			{
				id         : 'house',
				name       : 'House',
				status     : true,
				switch_off : 'House is NOT Open',
				switch_on  : 'House is OPEN',
			},
			{
				id         : 'mics',
				name       : 'Microphones',
				status     : true,
				switch_off : 'Microphones are NOT ready',
				switch_on  : 'Microphones are READY',
			},
			{
				id         : 'places',
				name       : 'Places',
				status     : false,
				switch_off : 'Places has NOT been called',
				switch_on  : 'Places HAS been called',
			},
		],
		timers : [
			{
				elapse_total   : 0,
				id             : 'timer_pre_show',
				is_active      : true,
				is_done        : false,
				is_down        : true,
				min_to_count   : null,
				name           : 'Pre Show',
				reset_places   : false,
				time_to_end    : sample_start_time.getTime(),
				time_was_start : null,

				items          : [
					{ name : 'Turn on bass wireless', time : 30, status : false },
					{ name : 'Turn off portrait lights', time : 5, status : false },
				],
			},
			{
				elapse_total   : 0,
				id             : 'timer_act_1',
				is_active      : false,
				is_done        : false,
				is_down        : false,
				min_to_count   : null,
				name           : 'Act 1',
				reset_places   : false,
				time_to_end    : null,
				time_was_start : null,
			},
			{
				elapse_total   : 0,
				id             : 'timer_intermission',
				is_active      : false,
				is_done        : false,
				is_down        : true,
				min_to_count   : 15,
				name           : 'Intermission',
				reset_places   : true,
				time_to_end    : null,
				time_was_start : null,
			},
			{
				elapse_total   : 0,
				id             : 'timer_act_2',
				is_active      : false,
				is_done        : false,
				is_down        : false,
				min_to_count   : null,
				name           : 'Act 2',
				reset_places   : false,
				time_to_end    : null,
				time_was_start : null,
			},
		],
	},
}).then(() => {
	/* eslint-disable no-console */
	console.log('Sample Record Updated')
})