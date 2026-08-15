/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License

	Renderer Main File
*/

// @ts-expect-error no types
import './scss/styles.scss'


import * as appStatus from './rdr-status'
import * as appConfig from './rdr-config'
import * as audioSys  from './rdr-audio'

import { IpcType } from './preload'
import { DataStackLog, DataStackStatus, DataStackTimerUpdate, TTSaveFile } from 'src/lib/control'

declare global {
	interface Window {
		ipc : IpcType
	}
}

document.addEventListener( 'DOMContentLoaded', () => {
	window.ipc.status()
	window.ipc.config()
	appConfig.configStartup()
	appConfig.dragDropFiles()
	audioSys.audioStart()
} )

window.ipc.receive( 'view', ( id : string ) => {
	const tabMenuEntry = document.getElementById( id )

	if ( tabMenuEntry !== null ) {
		tabMenuEntry.click()
	}
} )

window.ipc.receive( 'update', ( data : DataStackTimerUpdate ) => {
	appStatus.processTimeUpdate( data )
	audioSys.processUpdate( data )
} )

window.ipc.receive( 'log', ( data : DataStackLog ) => {
	appStatus.processLogUpdate( data )
} )

window.ipc.receive( 'status', ( data : DataStackStatus ) => {
	appStatus.processStatus( data )
} )

window.ipc.receive( 'config', ( data : TTSaveFile ) => {
	appConfig.updateConfig( data )
	audioSys.updateConfig( data )
} )