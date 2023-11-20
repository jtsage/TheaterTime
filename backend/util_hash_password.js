/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2023 J.T.Sage - ISC License

	Hash A password, using the same method the server does.
*/
/* eslint-disable no-console */

const cliArgs = process.argv
const util_util = require('./util_util.js')

console.log(util_util.hashPassword(cliArgs[2]))