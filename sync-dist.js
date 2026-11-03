const fs = require('fs');
const path = require('path');

const rootDist = path.join(__dirname, 'dist');
const clientDist = path.join(__dirname, 'client', 'dist');

try {
  if (fs.existsSync(rootDist)) {
    if (fs.existsSync(clientDist)) {
      fs.rmSync(clientDist, { recursive: true, force: true });
    }
    fs.cpSync(rootDist, clientDist, { recursive: true });
    console.log('[H.E.L.E.N.A.] Build sincronizado: dist -> client/dist');
  }
  const clientDir = path.join(__dirname, 'client');
  if (fs.existsSync(clientDir)) {
    fs.copyFileSync(path.join(__dirname, 'server.js'), path.join(clientDir, 'server.js'));
    const rootModules = path.join(__dirname, 'modules');
    const clientModules = path.join(clientDir, 'modules');
    if (fs.existsSync(rootModules)) {
      fs.cpSync(rootModules, clientModules, { recursive: true, force: true });
    }
    console.log('[H.E.L.E.N.A.] Backend sincronizado: server.js & modules -> client/');
  }
} catch (e) {
  console.warn('[H.E.L.E.N.A.] Aviso na sincronizacao dist:', e.message);
}
