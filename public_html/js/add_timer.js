/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2023 J.T.Sage - ISC License
*/
/* eslint-disable unicorn/no-unused-properties */

const byID      = (elementID) => document.getElementById(elementID)

const eventData = {
	internals : {
		adminPass : null,
		ipAddress : null,
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
				status     : false,
				switch_off : 'House is NOT Open',
				switch_on  : 'House is OPEN',
			},
			{
				id         : 'mics',
				name       : 'Microphones',
				status     : false,
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
				time_to_end    : 'today',
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
}

const buildSwitch = (idx, switchData) => {
	return `<div class="col">
		<div class="card text-bg-light">
			<div class="card-header">Public Switch #${idx+1}
				<div class="float-end">
					<div class="btn btn-sm btn-info" title="Edit" onclick="clientEditSwitch(${idx})"><i class="bi bi-pencil-square"></i></div>
					<div class="btn btn-sm btn-danger" title="Delete" onclick="clientDeleteSwitch(${idx})"><i class="bi bi-trash3"></i></div>
				</div>
			</div>
			<ul class="list-group list-group-flush">
				<li class="list-group-item list-group-item-light"><strong>ID</strong> : ${switchData.id}</li>
				<li class="list-group-item list-group-item-light"><strong>Name</strong> : ${switchData.name}</li>
				<li class="list-group-item list-group-item-light"><strong>Green Text</strong> : ${switchData.switch_on}</li>
				<li class="list-group-item list-group-item-light"><strong>Red Text</strong> : ${switchData.switch_off}</li>
				<li class="list-group-item list-group-item-light"><strong>Initial State</strong> : ${switchData.status ? 'GREEN' : 'RED'}</li>
			</ul>
		</div>
	</div>`
}

const fillFormData = () => {
	byID('internal_ip').value = eventData.internals.ipAddress
	byID('internal_password').value = eventData.internals.adminPass
	byID('info_subtitle').value = eventData.clientData.info.subtitle
	byID('info_title').value = eventData.clientData.info.title

	const switchHTML = []
	for ( const [idx, switchData] of eventData.clientData.switches.entries() ) {
		switchHTML.push(buildSwitch(idx, switchData))
	}
	byID('dyn_switches').innerHTML = switchHTML.join('')
}

document.addEventListener('DOMContentLoaded', () => {
	fetch('/timer_backend/remote_ip')
		.then( (response) => {
			if (response.status === 200) {
				response.json().then((data) => {
					eventData.internals.ipAddress = data.ip
					eventData.internals.adminPass = data.newPass

					fillFormData()
				})
			}
		}).catch( () => {
			// do nothing
		})

})