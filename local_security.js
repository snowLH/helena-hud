// =========================================================================
// H.E.L.E.N.A. LOCAL SECURITY & ACCESS CONTROL
// Proteção contra chamadas não-autorizadas, autenticação Mobile & Host
// =========================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const devicePairing = require('./modules/device_pairing');

const RUNTIME_DIR = path.join(__dirname, 'runtime');
const TOKEN_FILE = path.join(RUNTIME_DIR, 'auth_token.txt');

if (!fs.existsSync(RUNTIME_DIR)) {
  try { fs.mkdirSync(RUNTIME_DIR, { recursive: true }); } catch (_) {}
}

let cachedToken = null;

function getOrCreateLocalToken() {
  if (cachedToken) return cachedToken;

  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const existing = fs.readFileSync(TOKEN_FILE, 'utf-8').trim();
      if (existing && existing.length >= 32) {
        cachedToken = existing;
        return cachedToken;
      }
    }
  } catch (_) {}

  cachedToken = crypto.randomBytes(32).toString('hex');
  try {
    fs.writeFileSync(TOKEN_FILE, cachedToken, 'utf-8');
  } catch (err) {
    console.error('Erro ao gravar auth_token.txt:', err.message);
  }
  return cachedToken;
}

function isLocalIp(ip) {
  if (!ip) return false;
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
}

function isLocalHostOrigin(origin) {
  if (!origin) return true; // Janela nativa Electron / processo local direto
  try {
    const url = new URL(origin);
    const host = url.hostname;
    return host === 'localhost' || host === '127.0.0.1';
  } catch (_) {
    return false;
  }
}

// Middleware para endpoints de sistema e ferramentas sensíveis
// REGRA DE SEGURANÇA: Dispositivos na mesma rede Wi-Fi (192.168.x.x) NÃO têm acesso
// sem apresentar um x-helena-device-token válido obtido via Pareamento QR Code / PIN.
function requireLocalAuth(req, res, next) {
  const token = getOrCreateLocalToken();
  const providedHostToken = req.headers['x-helena-auth'];
  const providedDeviceToken = req.headers['x-helena-device-token'];
  const clientIp = req.ip || req.connection?.remoteAddress || '';

  // 1. Se o token de host local for válido
  if (providedHostToken && providedHostToken === token) {
    req.authSource = 'HOST_TOKEN';
    return next();
  }

  // 2. Se for requisição direta do próprio computador (127.0.0.1 / localhost)
  if (isLocalIp(clientIp) && isLocalHostOrigin(req.headers.origin)) {
    req.authSource = 'LOCAL_HOST';
    return next();
  }

  // 3. Se for um dispositivo móvel pareado e ativo enviando x-helena-device-token
  if (providedDeviceToken) {
    const validation = devicePairing.validateDeviceToken(providedDeviceToken, clientIp);
    if (validation.valid) {
      req.authSource = 'PAIRED_MOBILE';
      req.pairedDevice = validation.device;
      return next();
    }
    return res.status(401).json({
      error: 'Sessão mobile inválida ou revogada.',
      detalhes: validation.reason
    });
  }

  // 4. Bloqueio estrito para qualquer dispositivo não pareado na rede
  devicePairing.logAuditEvent({
    source: 'REDE_NAO_AUTENTICADA',
    deviceName: 'Dispositivo Não Pareado',
    ip: clientIp,
    action: `${req.method} ${req.originalUrl}`,
    status: 'BLOQUEADO_403',
    details: 'Tentativa de acesso sem pareamento autorizado.'
  });

  return res.status(403).json({
    error: 'Acesso negado: Dispositivo não autenticado.',
    detalhes: 'O acesso pela rede local exige pareamento prévio via QR Code ou Código PIN temporário no computador principal.'
  });
}

module.exports = {
  getOrCreateLocalToken,
  requireLocalAuth,
  isLocalIp
};
