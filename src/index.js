/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License
*/
const debug = true

const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron')
const path    = require('node:path')
const dgram   = require('node:dgram')
const fs      = require('node:fs')
const ThrTime = require('./lib/thrtime.js')
const osc     = require('simple-osc-lib')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { app.quit() }

let mainWindow = null

const dataStack = new ThrTime.Stack()

const oscIN  = dgram.createSocket({type : 'udp4', reuseAddr : true})
const oscOUT = dgram.createSocket({type : 'udp4', reuseAddr : true})
const oscLib = new osc.simpleOscLib()

oscIN.on('message', (msg, _rinfo) => { doOSC(msg) })
oscIN.on('error',   (err) => {
	dataStack.log.push(`osc listener error:\n${err.stack}\n`)
	oscIN.close()
})
oscIN.on('listening', () => {
	const address = oscIN.address()
	dataStack.log.push(`listening to osc on ${address.address}:${address.port}\n`)
})

oscIN.bind(dataStack.settings.receive.port, '0.0.0.0')



const createWindow = () => {
	mainWindow = new BrowserWindow({
		height : 650,
		title  : 'TheaterTime',
		width  : 900,

		webPreferences : {
			preload :  path.join(__dirname, 'preload.js'),
		},
	})

	mainWindow.loadFile(path.join(__dirname, 'render', 'index.html'))

	if ( debug ) {
		mainWindow.webContents.openDevTools({ mode : 'detach' })
	}
}

const outputConfig = () => { mainWindow.webContents.send('config', dataStack.config) }
const outputStatus = () => { mainWindow.webContents.send('status', dataStack.status) }
const outputUpdate = () => { mainWindow.webContents.send('update', dataStack.update) }
const outputLogger = () => { mainWindow.webContents.send('log',    dataStack.log) }
const configChange = () => { outputConfig(); outputStatus() }

app.whenReady().then(() => {
	ipcMain.on('config', outputConfig)
	ipcMain.on('status', outputStatus)

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
		oscIN.close()
		oscIN.bind(dataStack.settings.receive.port, '0.0.0.0')
		outputConfig()
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


const isMac = process.platform === 'darwin'
const template = [
	// { role: 'appMenu' }
	...(process.platform === 'darwin'
		? [{ role : 'appMenu' }]
		: []),
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
			{ label : 'Save Configuration', click : () => {
				dialog.showSaveDialog(mainWindow, {
					defaultPath : app.getPath('desktop'),
					filters     : [{ name : 'ThrTime Files', extensions : ['ttime'] }],
				}).then(async (result) => {
					if ( !result.canceled ) {
						try {
							
							fs.writeFileSync(result.filePath, JSON.stringify(dataStack.config, null, 2))
							app.addRecentDocument(result.filePath)
						} catch (err) {
							dataStack.log.push(err)
						}
					}
				}).catch((err) => {
					dataStack.log.push(err)
				})
			} },
			{ label : 'Load Configuration', click : () => {
				const options = {
					properties  : ['openFile'],
					defaultPath : app.getPath('desktop'),
					filters     : [{ name : 'ThrTime Files', extensions : ['ttime'] }],
				}

				dialog.showOpenDialog(mainWindow, options).then((result) => {
					if ( !result.canceled ) {
						try {
							const fileRaw  = fs.readFileSync(result.filePaths[0])
							const fileJSON = JSON.parse(fileRaw)
							dataStack.config = fileJSON
							configChange()
						} catch (err) {
							dataStack.log.push(err)
						}
					}
				}).catch((err) => {
					dataStack.log.push(err)
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
			{ label : 'Next Timer', click : () => {
				dataStack.next_timer()
				outputStatus()
			} },
			{ type : 'separator' },
			{ label : 'Reset All', click : () => {
				dataStack.reset_all()
				outputStatus()
			} },
		],
	},
	...(debug
		? [{ role : 'viewMenu' }]
		: []),
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)


function doOSC(packet) {
	try {
		const oscPacket    = oscLib.readPacket(packet)
		const addressParts = oscPacket.address.replace('/', '').split('/')

		if ( addressParts[0] !== 'theaterTime' ) { return }

		dataStack.log.push(`Acting on OSC : ${addressParts.join('/')}\n`)

		if ( addressParts[1] === 'switch' ) {
			const index = parseInt(addressParts[2], 10) - 1
			if      ( addressParts[3] === 'on' )     { dataStack.timers.on(index) }
			else if ( addressParts[3] === 'off' )    { dataStack.timers.off(index) }
			else if ( addressParts[3] === 'toggle' ) { dataStack.toggleSwitch(index) }
		} else if ( addressParts[1] === 'timer' ) {
			if      ( addressParts[2] === 'next' )     { dataStack.next_timer() }
			else if ( addressParts[2] === 'previous' ) { dataStack.timers.previous() }
			else if ( addressParts[2] === 'stop' )     { dataStack.timers.stop_all() }
			else if ( addressParts[2] === 'reset' )    { dataStack.reset_all() }
			oscToggle()
		} else if ( addressParts[1] === 'speak' ) {
			const speak = oscPacket.args[0]?.value || null
			if ( speak !== null && speak !== '' ) { dataStack.speakStack.push(speak) }
		}
		outputStatus()
	} catch (err) {
		dataStack.log.push(`OSC packet problem : ${err}\n`)
	}
}



// MARK: OSC (send)
function oscSend(buffer) {
	oscOUT.send(buffer, 0, buffer.length, dataStack.settings.send.port, dataStack.settings.send.host)
}

function oscActiveTimer() {
	if ( dataStack.settings.send.active ) {
		const timer = dataStack.timers.osc

		if ( timer === null ) { return }

		const forceEmpty = dataStack.settings.send.blink && ( timer.type !== 1 && timer.wholeSeconds < 0 && timer.wholeSeconds % 3 === 0 )

		oscSend(oscLib
			.messageBuilder('/theaterTime/currentTimer')
			.integer(timer.wholeSeconds)
			.string(forceEmpty ? '' : timer.title)
			.string(forceEmpty ? '' : timer.formatTime)
			.toBuffer()
		)
	}
}

function oscToggle() {
	if ( dataStack.toggle.config.length === 0 ) { return }
	// Old way of sending.
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