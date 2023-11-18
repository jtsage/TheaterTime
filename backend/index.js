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

// User configurable PORT.  If you change this,
// change it in the sample config files as well!
const PORT           = 3000

const crypto         = require('node:crypto')
const { Level }      = require('level')
const fastify        = require('fastify')({ logger : true })
const db             = new Level('theaterTimeDB', { valueEncoding : 'json' })
const { demoRecord } = require('./data_demo_record.js')
const fetch          = require('node-fetch')

fastify.get('/timer_backend/reset_demo', async (_, reply) => {
	db.put('00sample00', demoRecord).then(() => {
		reply.type('application/json').code(200)
		return { status : 'ok', errMsg : 'demo record reset' }
	})
})

fastify.get('/timer_backend/remote_ip', async (request, reply) => {
	reply.type('application/json').code(200)
	const newPass = await fetch('https://www.dinopass.com/password/simple')

	return { newPass : await newPass.text(), ip : request.headers['x-real-ip'] }
})

fastify.post('/timer_backend/hash_password', async (request, reply) => {
	const textPass = request.body.password
	const hashPass = crypto.createHash('sha512').update(textPass, 'utf-8').digest('hex').slice(0, 10)
	reply.type('application/json').code(200)
	return { hashPass : hashPass }
})

fastify.get('/timer_backend/', async (request, reply) => {
	reply.type('application/json').code(200)
	return { orig : JSON.stringify(request.headers), status : 'error', errMsg : 'invalid-page' }
})

fastify.post('/timer_backend/add', async (request, reply) => {
	// TODO: add item
	//const { timerID, secretToken } = request.params
	reply.type('application/json').code(200)
	return {
		body        : request.body,
		secretToken : 'blahblah2',
		status      : 'ok',
		timerID     : 'blahblah',
	}
})

fastify.post('/timer_backend/set/:timerID/:secretToken', async (request, reply) => {
	const { timerID, secretToken } = request.params
	const timerRecord = await db.get(timerID)
	const typeIDX     = request.body.idx
	const itemIDX     = request.body.subIdx

	if ( timerRecord !== null ) {
		const adminHash = crypto.createHash('sha512').update(timerRecord.internals.adminPass, 'utf-8').digest('hex').slice(0, 10)

		if ( secretToken !== adminHash ) {
			reply.type('application/json').code(403)
			return {
				status      : 1,
				status_msg  : 'credentials-failed',
				timerID     : timerID,
			}
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
		return {
			status      : 0,
			status_msg  : 'ok',
			timerID     : timerID,
		}
	}
	reply.type('application/json').code(404)
	return {
		status      : 1,
		status_msg  : 'record-not-found',
		timerID     : timerID,
	}
})

fastify.get('/timer_backend/read/:timerID/:secretToken?', async (request, reply) => {
	const { timerID, secretToken } = request.params

	const timerRecord = await db.get(timerID)
	
	if ( timerRecord !== null ) {
		reply.type('application/json').code(200)
		const adminHash = crypto.createHash('sha512').update(timerRecord.internals.adminPass, 'utf-8').digest('hex').slice(0, 10)
		return {
			clientData  : timerRecord.clientData,
			isAdmin     : secretToken === adminHash,
			status      : 0,
			status_msg  : 'ok',
			timerID     : timerID,
		}
	}
	reply.type('application/json').code(404)
	return {
		clientData  : null,
		isAdmin     : false,
		status      : 1,
		status_msg  : 'record-not-found',
		timerID     : timerID,
	}
})


fastify.listen({ port : PORT }, (err) => {
	if (err) {
		fastify.log.error(err)
		process.exit(1)
	}
})