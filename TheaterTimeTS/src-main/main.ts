import { app, BrowserWindow, ipcMain, Menu, dialog, OpenDialogOptions } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import dgram   from 'node:dgram';
import fs      from 'node:fs';
import ThrTime from './lib/thrtime';
// @ts-ignore
import osc     from 'simple-osc-lib';
import appCon  from '../package.json' with { type: 'json' };

const debug = !app.isPackaged && true;

const autoSavePath = path.join(app.getPath('userData'), 'config');
const autoSaveFile = path.join(autoSavePath, 'autosave.json');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
	app.quit();
}

app.commandLine.appendSwitch('disable-features', 'WebContentsDiscard');
app.commandLine.appendSwitch('disable-features', 'TabSuspender');
app.commandLine.appendSwitch('disable-background-timer-throttling');

let mainWindow : BrowserWindow

const dataStack = new ThrTime.Stack()


if ( fs.existsSync(autoSaveFile) ) {
	try {
		const fileRaw       = fs.readFileSync(autoSaveFile).toString()
		const fileJSON      = JSON.parse(fileRaw)
		dataStack.safe_load = fileJSON
	} catch (err) {
		if (err instanceof Error) {
			dataStack.log('main', err.message, 1)
		} else {
			throw err
		}
	}
}

let   oscIN : dgram.Socket | null  = null
const oscOUT = dgram.createSocket({type : 'udp4', reuseAddr : true})
const oscLib = new osc.simpleOscLib()

openOSCListener()


function openOSCListener() {
	oscIN  = dgram.createSocket({type : 'udp4', reuseAddr : true})
	oscIN.on('message', (msg, _rinfo) => { doOSC(msg) })
	oscIN.on('error',   (err) => {
		dataStack.log('main', `osc listener error:\n${err.stack}`, 1)
		if ( oscIN !== null ) {
			oscIN.close()
		}
	})
	oscIN.on('listening', () => {
		if ( oscIN !== null ) {
			const address = oscIN.address()
			dataStack.log('main', `listening to osc on ${address.address}:${address.port}`, 2)
		}
	})

	try {
		oscIN.bind(dataStack.settings.receive.port, '0.0.0.0')
	} catch (err) {
		if (err instanceof Error) {
			dataStack.log('main', `osc listener error:\n${err.stack}`, 1)
		} else {
			dataStack.log('main', `osc unknown error ${String(err)}`, 1)
		}
	}
}



const createWindow = () => {
	mainWindow = new BrowserWindow({
		height : 650,
		title  : `${appCon.productName} ${appCon.version}`,
		width  : 900,

		webPreferences : {
			backgroundThrottling : false,
			preload :  path.join(__dirname, 'preload.js'),
		},
	})

	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(
			path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
		);
	}

	if ( debug ) {
		mainWindow.webContents.openDevTools({ mode : 'detach' })
	}
}


const outputConfig = () => { safeSend('config', dataStack.config) }
const outputStatus = () => { safeSend('status', dataStack.status) }
const outputUpdate = () => { safeSend('update', dataStack.update) }
const outputLogger = () => { safeSend('log',    dataStack.logStack) }
const configChange = () => { outputConfig(); outputStatus() }

function safeSend(id : string, data: any) {
	if ( mainWindow !== null && ! mainWindow.isDestroyed() ) { mainWindow.webContents.send(id, data) }
}


app.whenReady().then(() => {
	ipcMain.on('config', outputConfig)

	ipcMain.handle('configSync', () => dataStack.config)
	ipcMain.handle('voiceList',  () => dataStack.voices)

	ipcMain.on('status', outputStatus)
	ipcMain.on('log',    outputLogger)
	ipcMain.on('logAudio', (_, text, level) => {
		dataStack.log('audioSystem', text, level)
	})

	ipcMain.on('voiceTest', () => { dataStack.speakStack.push('Testing.  Testing, 1. 2. 3.') })

	ipcMain.on('switch:save', (_, data) => {
		dataStack.toggle.clear()
		dataStack.toggle.add_stack(data)
		configChange()
	})
	ipcMain.on('switch:remove', (_, index) => {
		dataStack.toggle.remove(index)
		configChange()
	})
	ipcMain.on('switch:toggle', (_, index) => {
		dataStack.toggleSwitch(index)
		outputStatus()
	})

	ipcMain.on('timer:save', (_, data) => {
		dataStack.timers.clear()
		dataStack.timers.add_stack(data)
		configChange()
	})
	ipcMain.on('timer:remove', (_, index) => {
		dataStack.timers.remove(index)
		configChange()
	})
	ipcMain.on('timer:next', () => {
		dataStack.next_timer()
		outputStatus()
	})

	ipcMain.on('settings', (_, settings) => {
		dataStack.saveSettings(settings)
		autoSaveConfig()
		try {
			if ( oscIN !== null ) { oscIN.close() }
		} catch {
			dataStack.log('main', 'Socket close failed', 1)
		}
		openOSCListener()
		outputConfig()
	})

	ipcMain.on('config:load_drop', (_, file) => {
		try {
			const fileRaw       = fs.readFileSync(file).toString()
			const fileJSON      = JSON.parse(fileRaw)
			dataStack.safe_load = fileJSON
			if ( oscIN !== null ) { oscIN.close() }
			openOSCListener()
			configChange()
		} catch (err) {
			if (err instanceof Error) {
				dataStack.log('main', err.message, 1)
			} else {
				dataStack.log('main', `${String(err)}`, 1)
			}
		}
	})

	createWindow()

	setInterval(outputUpdate, 1000)
	setInterval(oscActiveTimer, 500)
	setInterval(oscToggle, 5000)
	setInterval(outputLogger, 30000)

	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('before-quit', () => {
	autoSaveConfig()
})

app.setAboutPanelOptions({
	applicationName : 'TheaterTime',
	applicationVersion : '1.0.2',
	copyright : 'Copyright © 2026',
})

// MARK: Main Menu
const isMac = process.platform === 'darwin'
const template : Electron.MenuItemConstructorOptions[] = [
	// { role: 'appMenu' }
	{
		label   : 'File',
		submenu : [
			{
				label : 'New',
				submenu : [
					{ label : 'New Blank Config', click : () => { dataStack.defaultEmpty(); configChange() } },
					{ label : 'New from Rehearsal Template', click : () => { dataStack.defaultRehearsal(); configChange() } },
					{ label : 'New from Show Template', click : () => { dataStack.defaultShow(); configChange() } },
				],
			},
			{ type : 'separator' },
			{ accelerator : 'CommandOrControl+S', label : 'Save Configuration', click : () => {
				dialog.showSaveDialog(mainWindow, {
					defaultPath : app.getPath('desktop'),
					filters     : [{ name : 'JSON Files', extensions : ['json'] }],
				}).then(async (result) => {
					if ( !result.canceled ) {
						try {
							fs.writeFileSync(result.filePath, JSON.stringify(dataStack.config, null, 2))
							app.addRecentDocument(result.filePath)
						} catch (err) {
							if (err instanceof Error) {
								dataStack.log('main', err.message, 1)
							} else {
								dataStack.log('main', `${String(err)}`, 1)
							}
						}
					}
				}).catch((err) => {
					if (err instanceof Error) {
						dataStack.log('main', err.message, 1)
					} else {
						dataStack.log('main', `${String(err)}`, 1)
					}
				})
			} },
			{ accelerator : 'CommandOrControl+O', label : 'Load Configuration', click : () => {
				const options : OpenDialogOptions = {
					properties  : ['openFile'],
					defaultPath : app.getPath('desktop'),
					filters     : [{ name : 'JSON Files', extensions : ['json'] }],
				}

				dialog.showOpenDialog(mainWindow, options).then((result) => {
					if ( !result.canceled ) {
						try {
							const fileRaw  = fs.readFileSync(result.filePaths[0]).toString()
							const fileJSON = JSON.parse(fileRaw)
							dataStack.safe_load = fileJSON
							if ( oscIN !== null ) { oscIN.close() }
							openOSCListener()
							configChange()
						} catch (err) {
							if (err instanceof Error) {
								dataStack.log('main', err.message, 1)
							} else {
								dataStack.log('main', `${String(err)}`, 1)
							}
						}
					}
				}).catch((err) => {
					if (err instanceof Error) {
						dataStack.log('main', err.message, 1)
					} else {
						dataStack.log('main', `${String(err)}`, 1)
					}
				})
			} },
			{ type : 'separator' },
			isMac ? { role : 'close' } : { role : 'quit' }
		],
	},
	{
		label   : 'Edit',
		submenu : [
			{ role : 'undo' },
			{ role : 'redo' },
			{ type : 'separator' },
			{ role : 'cut' },
			{ role : 'copy' },
			{ role : 'paste' },
			{ role : 'delete' },
		],
	},
	{
		label   : 'Control',
		submenu : [
			{ accelerator : 'CommandOrControl+N', label : 'Next Timer', click : () => {
				dataStack.next_timer()
				outputStatus()
			} },
			{ accelerator : 'CommandOrControl+Shift+N', label : 'Previous Timer', click : () => {
				dataStack.timers.previous()
				outputStatus()
			} },
			{ type : 'separator' },
			{ label : 'Reset All', click : () => {
				dataStack.reset_all()
				outputStatus()
			} },
			{ type : 'separator' },
			{ label : 'Set Target to TODAY', click : () => {
				dataStack.timers.force_today()
				outputConfig()
			} },
		],
	},
	{
		label   : 'View',
		submenu : [
			{ accelerator : 'CommandOrControl+1', label : 'Status', click : () => {
				safeSend('view', 'status-tab')
			} },
			{ accelerator : 'CommandOrControl+2', label : 'Timer Settings', click : () => {
				safeSend('view', 'timer-tab')
			} },
			{ accelerator : 'CommandOrControl+3', label : 'Switch Settings', click : () => {
				safeSend('view', 'toggle-tab')
			} },
			{ accelerator : 'CommandOrControl+4', label : 'General Settings', click : () => {
				safeSend('view', 'config-tab')
			} },
			{ type : 'separator' },
			{ accelerator : 'CommandOrControl+L', label : 'Log', click : () => {
				safeSend('view', 'log-tab')
			} },
			{ accelerator : 'CommandOrControl+H', label : 'Help', click : () => {
				safeSend('view', 'help-tab')
			} },
		],
	},
]

if (process.platform === 'darwin' ) {
	template.unshift({ role : 'appMenu' })
}
if ( debug ) {
	template.push({
		label   : 'Debug',
		submenu : [
			{ role : 'reload' },
			{ role : 'forceReload' },
			{ role : 'toggleDevTools' },
		]
	})
}

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

// MARK: OSC (recv)
function oscPrint(oscPacket: any) {
	return `${oscPacket.address} ${oscPacket.args.map((v : any) => ['[', v.type.substring(0, 1), ':', v.value, ']'].join('')).join(' ')}`
}
function doOSC(packet : any) {
	try {
		const oscPacket = oscLib.readPacket(packet)
		let   update    = true

		if ( !oscPacket.address.startsWith('/theaterTime') ) { return }

		dataStack.log('osc', `Acting on OSC : ${oscPrint(oscPacket)}`, 0)

		switch (oscPacket.address ) {
			case '/theaterTime/switch/on' :
				dataStack.oscOnSwitch(oscPacket.args[0]?.value)
				break
			case '/theaterTime/switch/off' :
				dataStack.oscOffSwitch(oscPacket.args[0]?.value)
				break
			case '/theaterTime/switch/toggle' :
				dataStack.oscToggleSwitch(oscPacket.args[0]?.value)
				break
			case '/theaterTime/timer/next' :
				dataStack.next_timer()
				break
			case '/theaterTime/timer/previous' :
				dataStack.timers.previous()
				break
			case '/theaterTime/timer/stop' :
				dataStack.timers.stop_all()
				break
			case '/theaterTime/reset' :
				dataStack.reset_all()
				break
			case '/theaterTime/speak' : {
				const speak = oscPacket.args[0]?.value || null
				if ( speak !== null && speak !== '' ) { dataStack.speakStack.push(speak) }
				break
			}
			default :
				update = false
				dataStack.log('osc', `UNMATCHED : ${oscPrint(oscPacket)}`, 0)
		}
	
		if ( update ) {
			outputStatus()
			oscActiveTimer()
			oscToggle()
		}
	} catch (err) {
		if (err instanceof Error) {
			dataStack.log('osc', `OSC packet problem:\n${err.stack}`, 1)
		} else {
			dataStack.log('osc', `OSC packet problem ${String(err)}`, 1)
		}
	}
}


function autoSaveConfig() {
	if ( ! fs.existsSync(autoSavePath) ) {
		try {
			fs.mkdirSync(autoSavePath)
		} catch (err) {
			// eslint-disable-next-line no-console
			console.log(`AutoSave Failed (Folder) - ${err}`)
		}
	}
	try {
		fs.writeFileSync(autoSaveFile, JSON.stringify(dataStack.config, null, 2))
	} catch (err) {
		// eslint-disable-next-line no-console
		console.log(`AutoSave Failed (File) - ${err}`)
	}
}


// MARK: OSC (send)
function oscSend(buffer : any) {
	for ( const paired of dataStack.settings.send.combo.split(',') ) {
		const parts = paired.split(':')
		try {
			oscOUT.send(buffer, 0, buffer.length, parts[1] ?? 4444, parts[0])
		} catch (err) {
			if (err instanceof Error) {
				dataStack.log('osc', `invalid sending to '${parts[0]}', port '${parts[1]} -- ${err.message}`, 1)
			} else {
				dataStack.log('osc', `invalid sending to '${parts[0]}', port '${parts[1]}`, 1)
			}
		}
	}
}

function oscActiveTimer() {
	if ( dataStack.settings.send.active ) {
		const timer = dataStack.timers.osc

		if ( timer === null ) { return }

		const forceEmpty = dataStack.settings.send.blink && ( timer.type !== 1 && typeof timer.wholeSeconds === 'number' && timer.wholeSeconds < 0 && timer.wholeSeconds % 3 === 0 )

		oscSend(oscLib
			.messageBuilder('/theaterTime/currentTimer')
			.integer(timer.wholeSeconds || 0)
			.string(forceEmpty ? '' : timer.title)
			.string(forceEmpty ? '' : timer.formatTime)
			.toBuffer()
		)
		if ( dataStack.settings.send.eos ) {
			oscSend(oscLib
				.messageBuilder('/theaterTime/EOSTimer')
				.string(`${timer.title} :: ${timer.formatTime}`)
				.toBuffer()
			)
		}
	}
}

function oscToggle() {
	if ( dataStack.toggle.config.length === 0 ) { return }

	// EOS compatible single-string
	if ( dataStack.settings.send.eos ) {
		dataStack.toggle.all.map((element, index) => {
			oscSend(oscLib
				.messageBuilder(`/theaterTime/EOSswitch/${(index+1).toString().padStart(2, '0')}`)
				.string(element.status === 1 ? element.textActive : element.textInactive)
				.toBuffer()
			)
		})
	}

	// Simple method
	if ( dataStack.settings.send.switch ) {
		oscSend(oscLib.buildBundle({
			timetag  : oscLib.getTimeTagBufferFromDelta(50/1000),
			elements : dataStack.toggle.all.map((element, index) => oscLib
				.messageBuilder(`/theaterTime/switch/${(index+1).toString().padStart(2, '0')}`)
				.string(element.title)
				.string(element.status === 1 ? element.textActive : element.textInactive)
				.integer(element.status)
				.toBuffer()
			),
		}))
	}

	// New way of sending
	// argument 1 : onText (if on) or empty
	// argument 2:  offText (if off) or empty
	if ( dataStack.settings.send.toggle ) {
		oscSend(oscLib.buildBundle({
			timetag  : oscLib.getTimeTagBufferFromDelta(50/1000),
			elements : dataStack.toggle.all.map((e, index) => {
				const textStrings = [
					e.status === 1 ? e.textActive : ' ',
					e.status === 1 ? ' ' : e.textInactive
				]

				if ( e.reverseColor ) { textStrings.reverse() }

				return oscLib
					.messageBuilder(`/theaterTime/toggle/${(index+1).toString().padStart(2, '0')}`)
					.string(textStrings[0])
					.string(textStrings[1])
					.toBuffer()
			}),
		}))
	}
}