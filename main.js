const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1100,
        height: 1000,
        minHeight:800,
        minWidth:900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            zoomFactor: 1.1
        }
    });
    
    ipcMain.handle('create-file',(req,data)=>{
        if(!data || !data.title || !data.content) return false;

        const filePath = path.join(__dirname,'notes', '${data.title}.txt');
        fs.writeFileSync(filePath, data.content);

        return {success: true, filePath};
    })

    mainWindow.loadFile('src/html/login.html'); 
}


app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
