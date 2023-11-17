/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2023 J.T.Sage - ISC License
*/

const fastify = require('fastify')({
	logger : true,
})

fastify.get('/', async (_, reply) => {
	reply.type('application/json').code(200)
	return { status : 'error', errMsg : 'no valid record' }
})

fastify.post('/add', (request, reply) => {
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

fastify.get('/:timerID/:secretToken?', (request, reply) => {
	const { timerID, secretToken } = request.params
	reply.type('application/json').code(200)
	return {
		status : 'ok',
		timerID : timerID,
		secretToken : secretToken,
	}
})


fastify.listen({ port : 3000 }, (err, address) => {
	if (err) {
		fastify.log.error(err)
		process.exit(1)
	}
	fastify.log.info(`server listening on ${address}`)
})