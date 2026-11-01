// =========================================================================
// H.E.L.E.N.A. — ELECTRON MAIN PROCESS (APLICATIVO DESKTOP NATIVO)
// Inicia o servidor local embutido, gerencia Janela Nativa e System Tray
// =========================================================================

const { app, BrowserWindow, Tray, Menu, shell } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isQuiting = false;

// Inicia o servidor local da H.E.L.E.N.A. no mesmo processo
require('./server.js');

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 880,
    minWidth: 1024,
    minHeight: 680,
    title: 'H.E.L.E.N.A. — Copiloto Pessoal de Inteligência Artificial',
    backgroundColor: '#020617',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'public', 'icons', 'helena.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL('http://localhost:3000?mode=app');

  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function createSystemTray() {
  const iconPath = path.join(__dirname, 'public', 'icons', 'helena.ico');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir H.E.L.E.N.A. (Console Desktop)',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Parear Celular (QR Code / PIN)',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.loadURL('http://localhost:3000?mode=app&pair=1');
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Iniciar junto com o Windows',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({
          openAtLogin: menuItem.checked,
          path: app.getPath('exe')
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Encerrar H.E.L.E.N.A. Completamente',
      click: () => {
        isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('H.E.L.E.N.A. — Copiloto Pessoal Ativa');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createMainWindow();
  createSystemTray();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});
