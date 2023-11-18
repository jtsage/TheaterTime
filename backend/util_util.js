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
	return crypto.createHash('sha512').update(plainText, 'utf-8').digest('hex').slice(0, 10)
}

module.exports.jsonRespond = (obj, err = null) => {
	const returnObj = obj

	returnObj.status    = err === null ? 0 : 1
	returnObj.statusMsg = err === null ? 'ok' : err

	return returnObj
}

module.exports.fetchBody = async (url) => {
	const bodyFetch = await fetch(url)
	const bodyText  = await bodyFetch.text()
	return bodyText
}