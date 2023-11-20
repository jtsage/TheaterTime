/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2023 J.T.Sage - ISC License

	Utilities
*/
const crypto = require('node:crypto')
const fetch  = require('node-fetch')

module.exports.hashPassword = (plainText) => {
	if ( typeof plainText === 'undefined' || plainText === '' || plainText === null ) { return '' }
	return crypto.createHash('sha512').update(plainText, 'utf-8').digest('hex').slice(0, 10)
}

module.exports.jsonRespond = (obj, err = null) => {
	const returnObj = obj ?? {}

	returnObj.status    = err === null ? 0 : 1
	returnObj.statusMsg = err === null ? 'ok' : err

	return returnObj
}

module.exports.fetchBody = async (url) => {
	if ( typeof url !== 'string' || url === '' || url === null ) { return '' }
	const bodyFetch = await fetch(url)
	const bodyText  = await bodyFetch.text()
	return bodyText
}

module.exports.makeNewID = (length = 10) => {
	let result  = ''
	let counter = 0
	const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	const charactersLength = characters.length
	
	while (counter < length) {
		result  += characters.charAt(Math.floor(Math.random() * charactersLength))
		counter += 1
	}
	return result
}

module.exports.prepEventRecord = (newRecord) => {
	if ( typeof newRecord?.internals === 'undefined' ) { return false }

	newRecord.internals.adminPass ??= 'poop_deck_23'

	if ( typeof newRecord?.clientData?.info === 'undefined' ) {
		return false
	}
	newRecord.clientData.info.title    ??= '--'
	newRecord.clientData.info.subtitle ??= '--'

	if ( typeof newRecord?.clientData?.timers === 'undefined' || newRecord.clientData.timers.length === 0 ) {
		return false
	}
	if ( typeof newRecord?.clientData?.switches === 'undefined' || newRecord.clientData.switches.length === 0 ) {
		return false
	}

	const switchIDs   = newRecord.clientData.switches.map((x) => x.id)
	if ( switchIDs.length !== new Set(switchIDs).size ) { return false }
	if ( ! switchIDs.includes('places') ) { return false }

	const timerIDs    = newRecord.clientData.timers.map((x) => x.id)
	if ( timerIDs.length !== new Set(timerIDs).size ) { return false }
	if ( !newRecord.clientData.timers[0].is_down || newRecord.clientData.timers[0].time_to_end === null ) { return false }

	try {
		for ( const [idx, timerData] of newRecord.clientData.timers.entries() ) {
			timerData.elapse_total   = 0
			timerData.is_active      = idx === 0
			timerData.is_done        = false
			timerData.time_was_start = null
		}
		return newRecord
	} catch { return false }
}

module.exports.getExpiration = (timestamp) => {
	const oneWeek  = Date.now() - ( 1000 * 60 * 60 * 24 * 7 )
	const oneMonth = Date.now() - ( 1000 * 60 * 60 * 24 * 30 )
	return {
		month : timestamp < oneMonth,
		week  : timestamp < oneWeek,
	}
}