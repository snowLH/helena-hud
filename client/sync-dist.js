const fs = require('fs');
const path = require('path');

const clientDist = path.join(__dirname, 'dist');
const rootDist = path.join(__dirname, '..', 'dist');

try {
  if (fs.existsSync(clientDist)) {
    fs.cpSync(clientDist, rootDist, { recursive: true });
    console.log('[H.E.L.E.N.A.] Build sincronizado: client/dist -> ../dist');
  }
} catch (e) {
  console.warn('[H.E.L.E.N.A.] Aviso na sincronizacao dist:', e.message);
}
