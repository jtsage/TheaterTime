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

		removeSwitch : (index) => ipcRenderer.send('switch:remove', index),
		removeTimer  : (index) => ipcRenderer.send('timer:remove', index),

		saveSwitch : (data) => ipcRenderer.send('switch:save', data),
		saveTimer  : (data) => ipcRenderer.send('timer:save', data),

		nextTimer    : () => ipcRenderer.send('timer:next'),
		toggleSwitch : (index) => ipcRenderer.send('switch:toggle', index),

		saveSettings : (settings) => ipcRenderer.send('settings', settings),

		receive   : ( channel, func ) => {
			const validChannels = new Set([
				'config',
				'status',
				'update',
			])
		
			if ( validChannels.has( channel ) ) {
				ipcRenderer.on( channel, ( _, ...args ) => func( ...args ))
			}
		},
	}
)