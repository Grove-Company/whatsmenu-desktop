import { app, autoUpdater, dialog } from "electron";

const server = 'whatsmenu-desktop-update-server.vercel.app'
const url = `${server}/update/${process.platform}/${app.getVersion()}`
const UPDATE_CHECK_INTERVAL = 1000 * 60
autoUpdater.setFeedURL({ url })

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts: Electron.MessageBoxOptions = {
    type: 'info',
    buttons: ['Reiniciar e atualizar', 'Mais tarde'],
    title: 'Atualização disponível!',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail:
      'Uma nova versão foi baixada. Reinicie o aplicativo para aplicar as atualizações.',
  }

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    // mainWindow.removeAllListeners()
    if (returnValue.response === 0) autoUpdater.quitAndInstall()
  })
})

autoUpdater.on('checking-for-update', () => {
  // mainWindow.webContents.send('warn', 'Bucando por novas atualizações...')
})

autoUpdater.on('update-available', () => {
  // mainWindow.webContents.send('warn', 'Nova atualização disponível, baixando...')
})

autoUpdater.on('error', (message) => {
  // mainWindow.webContents.send('error', message)
  // console.error('There was a problem updating the application')
  // console.error(message)
})

setInterval(() => {
  autoUpdater.checkForUpdates()
}, UPDATE_CHECK_INTERVAL)