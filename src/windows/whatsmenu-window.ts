import { BrowserWindow, app, screen } from 'electron';
import isDev from 'electron-is-dev';
import path from 'path';
import { whatsmenu_menu } from '../main/menu';
import { botWindow } from './bot-window';

export const whatsmenuWindow = {

  /**
   * Create a new BrowserWindow with specified width and height, load a URL, set a menu, and return the window.
   *
   * @return {BrowserWindow} The newly created BrowserWindow
   */
  createWindow(): BrowserWindow {
    const mainScreen = screen.getPrimaryDisplay()
    const { width, height } = mainScreen.size
    const window = new BrowserWindow({
      width,
      height,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    window.maximize()
    window.loadURL('https://next.whatsmenu.com.br/')
    // window.loadURL('http://localhost:3000')
    isDev && window.webContents.openDevTools()
    window.setMenu(whatsmenu_menu)
    window.on('close', () => {
      botWindow.forceCloseWindow()
      app.quit()
    })
    return window
  }
}