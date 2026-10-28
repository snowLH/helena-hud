const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=======================================================');
console.log('  H.E.L.E.N.A. — GERADOR DE PACOTE PORTÁTIL (ZIP)');
console.log('=======================================================');

const ROOT_DIR = path.resolve(__dirname, '..');
const STAGING_DIR = path.join(ROOT_DIR, 'temp_portable');
const PUBLIC_DOWNLOADS = path.join(ROOT_DIR, 'public', 'downloads');
const DIST_DOWNLOADS = path.join(ROOT_DIR, 'dist', 'downloads');

// Ensure destination directories exist
if (!fs.existsSync(PUBLIC_DOWNLOADS)) fs.mkdirSync(PUBLIC_DOWNLOADS, { recursive: true });
if (!fs.existsSync(DIST_DOWNLOADS)) fs.mkdirSync(DIST_DOWNLOADS, { recursive: true });

// Ensure staging directory is clean
if (fs.existsSync(STAGING_DIR)) {
  fs.rmSync(STAGING_DIR, { recursive: true, force: true });
}
fs.mkdirSync(STAGING_DIR, { recursive: true });

// 1. Files and folders to include in portable package
const itemsToCopy = [
  'dist',
  'server.js',
  'ai_hub.js',
  'technical_diagnostics.js',
  'local_security.js',
  'dados_pessoais.json',
  'perfil_usuario.json',
  'memoria_longa.json',
  'package.json',
  'Iniciar_HELENA.bat',
  'HELENA_PENDRIVE.bat',
  'HELENA_DESKTOP.vbs',
  'LEIA-ME_PENDRIVE.txt'
];

console.log('[1/4] Copiando arquivos essenciais para o pacote portátil...');
for (const item of itemsToCopy) {
  const src = path.join(ROOT_DIR, item);
  const dest = path.join(STAGING_DIR, item);

  if (fs.existsSync(src)) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
  } else {
    console.warn(`[AVISO] Arquivo não encontrado: ${item}`);
  }
}

// 2. Also copy HELENA_PENDRIVE.bat directly to downloads folder for single-click bat download
fs.copyFileSync(path.join(ROOT_DIR, 'HELENA_PENDRIVE.bat'), path.join(PUBLIC_DOWNLOADS, 'HELENA_PENDRIVE.bat'));
fs.copyFileSync(path.join(ROOT_DIR, 'HELENA_PENDRIVE.bat'), path.join(DIST_DOWNLOADS, 'HELENA_PENDRIVE.bat'));

// 3. Compress using PowerShell Compress-Archive
const zipDest = path.join(PUBLIC_DOWNLOADS, 'helena-portatil.zip');
console.log('[2/4] Compactando pacote portátil em ZIP...');

try {
  const psCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '${STAGING_DIR}\\*' -DestinationPath '${zipDest}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });

  // Sync to dist/downloads
  fs.copyFileSync(zipDest, path.join(DIST_DOWNLOADS, 'helena-portatil.zip'));

  const stat = fs.statSync(zipDest);
  const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
  console.log(`[3/4] Pacote ZIP gerado com sucesso: ${sizeMB} MB`);
  console.log(`      Destino: ${zipDest}`);
} catch (err) {
  console.error('[ERRO] Falha ao compactar ZIP:', err.message);
}

// 4. Cleanup staging
console.log('[4/4] Limpando arquivos temporários...');
try {
  fs.rmSync(STAGING_DIR, { recursive: true, force: true });
} catch (_) {}

console.log('=======================================================');
console.log('  PACOTE PORTÁTIL DA H.E.L.E.N.A. PRONTO PARA DISTRIBUIÇÃO!');
console.log('=======================================================');
