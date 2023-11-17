/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2023 J.T.Sage - ISC License

	Backend Server
*/
const crypto         = require('node:crypto')
const {sampleRecord} = require('./demo_record.js')
const fastify        = require('fastify')({
	logger : true,
})

fastify.get('/timer_backend/', async (_, reply) => {
	reply.type('application/json').code(200)
	return { status : 'error', errMsg : 'no valid record' }
})

fastify.post('/timer_backend/add', (request, reply) => {
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

fastify.get('/timer_backend/:timerID/:secretToken?', (request, reply) => {
	const { timerID, secretToken } = request.params
	const timerRecord = timerID === '00sample00' ? sampleRecord : null

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


fastify.listen({ port : 3000 }, (err, address) => {
	if (err) {
		fastify.log.error(err)
		process.exit(1)
	}
	fastify.log.info(`server listening on ${address}`)
})