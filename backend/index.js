/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2023 J.T.Sage - ISC License

	Backend Server - binds to localhost (127.0.0.1)

	Note: Proxy to nginx or apache is assumed. See:
	 - sample_nginx_config.txt
	 - sample_apache_config.txt
*/

let serverConfig = {}

const path           = require('node:path')

try {
	serverConfig = require(path.join(__dirname, '..', 'server_config.json'))
} catch {
	/* eslint-disable no-console */
	console.log('ERROR: Server configuration file not found. See ../server_config.sample.json')
	process.exit(1)
	/* eslint-enable no-console */
}

const { Level }      = require('level')
const fastify        = require('fastify')({ ignoreTrailingSlash : true, logger : true })
const db             = new Level(path.join(__dirname, 'theaterTimeDB'), { valueEncoding : 'json' })
const { demoRecord, blankRecord } = require('./data_event_records.js')
const util_util      = require('./util_util.js')

fastify.register(require('@fastify/static'), {
	root : path.join(__dirname, '..', 'public_html'),
})

fastify.setNotFoundHandler((_, reply) => {
	reply.code(200).type('text/html').sendFile('nope.html')
})

fastify.get('/timer/:timerID/:secretToken?', (_, reply) => {
	reply.code(200).type('text/html').sendFile('run_timer.html', { cacheControl : false })
})

fastify.get('/api/local_ip', async (request, reply) => {
	const searchIP   = request.headers['x-real-ip']
	const recordList = []
	try {
		for await (const [key, value] of db.iterator()) {
			if ( searchIP === value.internals.ipAddress ) {
				recordList.push({
					addTime    : value.internals.addDate,
					expStatus  : util_util.getExpiration(value.internals.addDate),
					ip         : value.internals.ipAddress,
					name       : value.clientData.info.title,
					startTime  : value.clientData.timers[0].time_to_end,
					subtitle   : value.clientData.info.subtitle,
					timerID    : key,
					timersRem  : value.clientData.timers.map((x) => x.is_done).filter((x) => !x).length,
				})
			}
		}

		const sortedList = recordList
			.sort((a, b) => a.startTime < b.startTime ? -1 : ( a.startTime > b.startTime ? 1 : 0))
			.sort((a, b) => a.timersRem > b.timersRem ? -1 : ( a.timersRem < b.timersRem ? 1 : 0))

		reply.type('application/json').code(200)
		return util_util.jsonRespond({ your_ip : searchIP, recordList : sortedList })
	} catch (err) {
		reply.type('application/json').code(500)
		return util_util.jsonRespond({ your_ip : searchIP, errorMessage : err }, 'unknown-error')
	}
})

fastify.get('/api/list_all/:secretToken', async (request, reply) => {
	const requestIP       = request.headers['x-real-ip']
	const { secretToken } = request.params

	if ( ! serverConfig.ADMIN_IP_LIST.includes(requestIP)) {
		reply.type('application/json').code(403)
		return util_util.jsonRespond({ your_ip : requestIP }, 'admin-ip-invalid')
	}

	if ( util_util.hashPassword(serverConfig.ADMIN_PASS) !== secretToken) {
		reply.type('application/json').code(403)
		return util_util.jsonRespond({ your_ip : requestIP }, 'admin-password-invalid')
	}

	const recordList = []
	try {
		for await (const [key, value] of db.iterator()) {
			recordList.push({
				addTime    : value.internals.addDate,
				adminHash  : util_util.hashPassword(value.internals.adminPass),
				expStatus  : util_util.getExpiration(value.internals.addDate),
				ip         : value.internals.ipAddress,
				name       : value.clientData.info.title,
				startTime  : value.clientData.timers[0].time_to_end,
				subtitle   : value.clientData.info.subtitle,
				timerID    : key,
				timersRem  : value.clientData.timers.map((x) => x.is_done).filter((x) => !x).length,
			})
		}

		const sortedList = recordList
			.sort((a, b) => a.startTime < b.startTime ? -1 : ( a.startTime > b.startTime ? 1 : 0))
			.sort((a, b) => a.timersRem > b.timersRem ? -1 : ( a.timersRem < b.timersRem ? 1 : 0))

		reply.type('application/json').code(200)
		return util_util.jsonRespond({ your_ip : requestIP, recordList : sortedList })
	} catch (err) {
		reply.type('application/json').code(500)
		return util_util.jsonRespond({ your_ip : requestIP, errorMessage : err }, 'unknown-error')
	}
})

fastify.get('/api/clean_up', async (_, reply) => {
	const recordList = []
	try {
		db.put('00sample00', demoRecord())
		for await (const [key, value] of db.iterator()) {
			const timersRemain = value.clientData.timers.map((x) => x.is_done).filter((x) => !x).length
			const expStatus    = util_util.getExpiration(value.internals.addDate)

			if ( expStatus.week && timersRemain === 0 || expStatus.month ) {
				recordList.push({ type : 'del', key : key })
			}
		}
		if ( recordList.length !== 0 ) {
			return db.batch(recordList).then(() => {
				reply.type('application/json').code(200)
				return util_util.jsonRespond({ recordList : recordList })
			}).catch((err) => {
				reply.type('application/json').code(500)
				return util_util.jsonRespond({ errorMessage : err, recordList : recordList }, 'batch-cleanup-failed')
			})
		}
		reply.type('application/json').code(200)
		return util_util.jsonRespond({ recordList : recordList }, 'no-stale-records')
	} catch (err) {
		reply.type('application/json').code(500)
		return util_util.jsonRespond({ errorMessage : err }, 'unknown-error')
	}
})

fastify.get('/api/blank_record', async (_, reply) => {
	reply.type('application/json').code(200)
	return blankRecord()
})

fastify.get('/api/reset_demo', async (_, reply) => {
	db.put('00sample00', demoRecord()).then(() => {
		reply.type('application/json').code(200)
		return util_util.jsonRespond({message : 'demo record reset' })
	})
})

fastify.get('/api/remote_ip', async (request, reply) => {
	reply.type('application/json').code(200)
	return util_util.jsonRespond({
		ip      : request.headers['x-real-ip'],
		newPass : await util_util.fetchBody('https://www.dinopass.com/password/simple'),
	})
})

fastify.post('/api/hash_password', async (request, reply) => {
	reply.type('application/json').code(200)
	return util_util.jsonRespond({ hashPass : util_util.hashPassword(request.body.password) })
})

fastify.post('/api/set/:timerID/:secretToken', async (request, reply) => {
	const { timerID, secretToken } = request.params
	const timerRecord              = await db.get(timerID)
	const typeIDX                  = request.body.idx
	const itemIDX                  = request.body.subIdx

	if ( timerRecord !== null ) {
		const adminHash = util_util.hashPassword(timerRecord.internals.adminPass)

		if ( secretToken !== adminHash ) {
			reply.type('application/json').code(403)
			return util_util.jsonRespond({ timerID : timerID }, 'invalid-credentials')
		}

		switch ( request.body.type ) {
			case 'switch' :
				timerRecord.clientData.switches[typeIDX].status = !timerRecord.clientData.switches[typeIDX].status
				break
			case 'item' :
				timerRecord.clientData.timers[typeIDX].items[itemIDX].status = !timerRecord.clientData.timers[typeIDX].items[itemIDX].status
				break
			case 'timer' :
				timerRecord.clientData.timers[typeIDX].is_active = false
				timerRecord.clientData.timers[typeIDX].is_done   = true

				if ( !timerRecord.clientData.timers[typeIDX].is_down ) {
					timerRecord.clientData.timers[typeIDX].elapse_total = (Date.now() - timerRecord.clientData.timers[typeIDX].time_was_start) / 1000
				}

				if ( typeof timerRecord.clientData.timers[typeIDX+1] !== 'undefined' ) {
					timerRecord.clientData.timers[typeIDX+1].is_active = true
					timerRecord.clientData.timers[typeIDX+1].time_was_start = Date.now()

					if ( timerRecord.clientData.timers[typeIDX+1].reset_places ) {
						for ( const [idx, switchData] of timerRecord.clientData.switches.entries() ) {
							if ( switchData.id === 'places' ) {
								timerRecord.clientData.switches[idx].status = false
								break
							}
						}
					}
				}
				break
			case 'timer_back':
				if ( typeof timerRecord.clientData.timers[typeIDX] !== 'undefined' ) {
					timerRecord.clientData.timers[typeIDX].is_active      = false
					timerRecord.clientData.timers[typeIDX].time_was_start = null
					timerRecord.clientData.timers[typeIDX].is_done        = false
					timerRecord.clientData.timers[typeIDX].elapse_total   = 0
				}

				if ( typeof timerRecord.clientData.timers[typeIDX-1] !== 'undefined' ) {
					timerRecord.clientData.timers[typeIDX-1].elapse_total = 0
					timerRecord.clientData.timers[typeIDX-1].is_active    = true
					timerRecord.clientData.timers[typeIDX-1].is_done      = false
				}
				break
			default :
				break
		}

		await db.put(timerID, timerRecord)

		reply.type('application/json').code(200)
		return util_util.jsonRespond({ timerID : timerID })
	}
	reply.type('application/json').code(404)
	return util_util.jsonRespond({ timerID : timerID }, 'record-not-found')
})

fastify.post('/api/delete/:timerID/:secretToken', async (request, reply) => {
	const { timerID, secretToken } = request.params
	const timerRecord              = await db.get(timerID)

	if ( timerRecord === null ) {
		reply.type('application/json').code(403)
		return util_util.jsonRespond({ timerID : timerID }, 'invalid-record')
	}

	const adminHash = util_util.hashPassword(timerRecord.internals.adminPass)

	if ( secretToken !== adminHash ) {
		reply.type('application/json').code(403)
		return util_util.jsonRespond({ timerID : timerID }, 'invalid-credentials')
	}

	return db.del(timerID).then(() => {
		if ( timerID === '00sample00' ) {
			return db.put('00sample00', demoRecord()).then(() => {
				reply.type('application/json').code(200)
				return util_util.jsonRespond({message : 'demo record reset' })
			})
		}
		reply.type('application/json').code(200)
		return util_util.jsonRespond({ timerID : timerID })
	}).catch(() => {
		reply.type('application/json').code(500)
		return util_util.jsonRespond({ timerID : timerID }, 'delete-failed')
	})
})

fastify.get('/api/read/:timerID/:secretToken?', async (request, reply) => {
	const { timerID, secretToken } = request.params
	const timerRecord              = await db.get(timerID)
	
	if ( timerRecord !== null ) {
		reply.type('application/json').code(200)
		const adminHash = util_util.hashPassword(timerRecord.internals.adminPass)
		return util_util.jsonRespond({
			clientData  : timerRecord.clientData,
			isAdmin     : secretToken === adminHash,
			timerID     : timerID,
		})
	}
	reply.type('application/json').code(404)
	return util_util.jsonRespond({
		clientData  : null,
		isAdmin     : false,
		timerID     : timerID,
	}, 'record-not-found')
})

fastify.post('/api/add', async (request, reply) => {
	const newData = util_util.prepEventRecord(request.body)

	if ( newData === false ) {
		reply.type('application/json').code(400)
		return util_util.jsonRespond({}, 'create-timer-failed-invalid-data')
	}

	let newID     = ''
	let collision = true
	while ( collision ) {
		newID = util_util.makeNewID(10)
		try {
			/* eslint-disable no-await-in-loop */
			await db.get(newID)
			/* if no error, collision exists, try again */
			/* eslint-enable no-await-in-loop */
		} catch {
			collision = false
		}
	}

	newData.internals.addDate = Date.now()

	return db.put(newID, newData).then(() => {
		reply.type('application/json').code(200)
		return util_util.jsonRespond({
			addedRecord : newData,
			adminHash   : util_util.hashPassword(newData.internals.adminPass),
			timerID     : newID,
		})
	}).catch((err) => {
		reply.code(500).type('application/json')
		return util_util.jsonRespond({
			addedRecord  : newData,
			adminHash    : util_util.hashPassword(newData.internals.adminPass),
			errorMessage : err,
			timerID      : newID,
		}, 'create-timer-failed')
	})
})

fastify.get('/api*', async (_, reply) => {
	reply.type('application/json').code(403)
	return util_util.jsonRespond({}, 'invalid-request')
})

fastify.listen({ port : serverConfig.PORT, address : serverConfig.ADDRESS }, (err) => {
	if (err) {
		fastify.log.error(err)
		process.exit(1)
	}
})