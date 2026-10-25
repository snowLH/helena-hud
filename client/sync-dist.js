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
} catch (e) {
  console.warn('[H.E.L.E.N.A.] Aviso na sincronizacao dist:', e.message);
}
