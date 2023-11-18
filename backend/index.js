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
const ADDRESS        = '127.0.0.1' // '0.0.0.0' for all interfaces

const path           = require('node:path')
const { Level }      = require('level')
const fastify        = require('fastify')({ logger : true })
const db             = new Level('theaterTimeDB', { valueEncoding : 'json' })
const { demoRecord } = require('./data_demo_record.js')
const util_util      = require('./util_util.js')

fastify.register(require('@fastify/static'), {
	root : path.join(__dirname, '..', 'public_html'),
	send : {
		cacheControl : false,
	},
})

fastify.get('/:timerID/timer/:secretToken?', (_, reply) => {
	reply.code(200).type('text/html').sendFile('run_timer.html', { cacheControl : false })
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

fastify.get('/api/', async (_, reply) => {
	reply.type('application/json').code(403)
	return util_util.jsonRespond({}, 'invalid-page')
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


fastify.listen({ port : PORT, address : ADDRESS }, (err) => {
	if (err) {
		fastify.log.error(err)
		process.exit(1)
	}
})