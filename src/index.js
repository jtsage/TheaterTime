/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License
*/
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
// const Timers = require('lib/timer.js')
// const Switches = require('lib/switch.js')
const ThrTime = require('./lib/thrtime.js')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { app.quit() }

let mainWindow = null

const dataStack = new ThrTime.Stack()


// Create the browser window.
const createWindow = () => {
	mainWindow = new BrowserWindow({
		height : 800,
		title  : 'TheaterTime',
		width  : 1000,

		webPreferences : {
			preload :  path.join(__dirname, 'preload.js'),
		},
	})

	mainWindow.loadFile(path.join(__dirname, 'render', 'index.html'))
}

const outputConfig = () => { mainWindow.webContents.send('config', dataStack.config) }

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
	ipcMain.on('config', outputConfig)

	ipcMain.on('switch:save', (_, data) => {
		dataStack.toggle.clear()
		dataStack.toggle.add_stack(data)
		outputConfig()
	})
	ipcMain.on('switch:remove', (_, index) => {
		dataStack.toggle.remove(index)
		outputConfig()
	})

	createWindow()

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
