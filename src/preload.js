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

		nextTimer    : () => ipcRenderer.send('timer:next'),
		removeSwitch : (index) => ipcRenderer.send('switch:remove', index),
		removeTimer  : (index) => ipcRenderer.send('timer:remove', index),
		saveSettings : (settings) => ipcRenderer.send('settings', settings),
		saveSwitch   : (data) => ipcRenderer.send('switch:save', data),
		saveTimer    : (data) => ipcRenderer.send('timer:save', data),
		toggleSwitch : (index) => ipcRenderer.send('switch:toggle', index),
		updateLog    : () => ipcRenderer.send('log'),

		receive   : ( channel, func ) => {
			const validChannels = new Set([
				'config',
				'status',
				'update',
				'log',
				'view',
			])
		
			if ( validChannels.has( channel ) ) {
				ipcRenderer.on( channel, ( _, ...args ) => func( ...args ))
			}
		},
	}
)