/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2023 J.T.Sage - ISC License

	Daily Cleanup
*/

/* eslint-disable no-console */

const fetch = require('node-fetch')

fetch('http://localhost:3000/api/clean_up')
	.then((res) => res.text())
	.then(() => console.log('Stale Records Purged'))
	.catch((err) => console.log('Connection Failed: ', err))

fetch('http://localhost:3000/api/reset_demo')
	.then((res) => res.text())
	.then(() => console.log('Demo Data Reset'))
	.catch((err) => console.log('Connection Failed: ', err))