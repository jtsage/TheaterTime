/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License
*/
// preload file.  all windows.

const {contextBridge, ipcRenderer } = require('electron')


contextBridge.exposeInMainWorld(
	'ipc', {
		config : () => ipcRenderer.send('config'),
		status : () => ipcRenderer.send('status'),
		// get  : (key)       => ipcRenderer.invoke('i18n:get', key),
		// lang : (nv = null) => ipcRenderer.invoke('i18n:lang', nv),
		// list : ()          => ipcRenderer.invoke('i18n:langList'),

		receive   : ( channel, func ) => {
			const validChannels = new Set([
				'config',
			])
		
			if ( validChannels.has( channel ) ) {
				ipcRenderer.on( channel, ( _, ...args ) => func( ...args ))
			}
		},
	}
)