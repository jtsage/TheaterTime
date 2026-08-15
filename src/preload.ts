/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
	| | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
	|_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License
*/
// preload file.  all windows.

import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { TTSettings } from './lib/control'
import type { SwitchDef }  from './lib/switch'
import type { TimerDef }   from './lib/timer'

const ipc = {
	config : () => ipcRenderer.send( 'config' ),
	status : () => ipcRenderer.send( 'status' ),

	logAudio : ( text : string, level : number ) => ipcRenderer.send( 'logAudio', text, level ),

	configSync : () => ipcRenderer.invoke( 'configSync' ),
	voiceList  : () => ipcRenderer.invoke( 'voiceList' ),
	voiceTest  : () => ipcRenderer.send( 'voiceTest' ),

	nextTimer    : ()                           => ipcRenderer.send( 'timer:next' ),
	removeSwitch : ( index : number )           => ipcRenderer.send( 'switch:remove', index ),
	removeTimer  : ( index : number )           => ipcRenderer.send( 'timer:remove', index ),
	saveSettings : ( settings : TTSettings )    => ipcRenderer.send( 'settings', settings ),
	saveSwitch   : ( data : SwitchDef[] )       => ipcRenderer.send( 'switch:save', data ),
	saveTimer    : ( data : TimerDef[] )        => ipcRenderer.send( 'timer:save', data ),
	toggleSwitch : ( index : number )           => ipcRenderer.send( 'switch:toggle', index ),
	updateLog    : ()                           => ipcRenderer.send( 'log' ),

	getFilePath  : ( file : File )   => webUtils.getPathForFile( file ),
	loadConfig   : ( file : string ) => ipcRenderer.send( 'config:load_drop', file ),

	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	receive   : ( channel : string, func : Function ) => {
		const validChannels = new Set( [
			'config',
			'status',
			'update',
			'log',
			'view',
		] )
	
		if ( validChannels.has( channel ) ) {
			ipcRenderer.on( channel, ( _, ...args ) => func( ...args ) )
		}
	},
}

contextBridge.exposeInMainWorld( 'ipc', ipc )
export type IpcType = typeof ipc