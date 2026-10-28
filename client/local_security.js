// =========================================================================
// H.E.L.E.N.A. LOCAL SECURITY & ACCESS CONTROL
// Proteção contra chamadas não-autorizadas e isolamento de ferramentas
// =========================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

  // Generate a high-entropy 256-bit token
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

function isAuthorizedOrigin(origin) {
  if (!origin) return true; // Direct desktop window / local process
  try {
    const url = new URL(origin);
    const host = url.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.');
  } catch (_) {
    return false;
  }
}

// Middleware para endpoints de sistema e ferramentas sensíveis
function requireLocalAuth(req, res, next) {
  const token = getOrCreateLocalToken();
  const providedToken = req.headers['x-helena-auth'];

  // 1. Se o token fornecido for válido, acesso liberado
  if (providedToken && providedToken === token) {
    return next();
  }

  // 2. Se for requisição direta local (sem origin externo e de IP local), permitir
  const clientIp = req.ip || req.connection?.remoteAddress;
  const origin = req.headers.origin;

  if (isLocalIp(clientIp) && isAuthorizedOrigin(origin)) {
    return next();
  }

  // 3. Caso contrário, bloqueio de segurança
  return res.status(403).json({
    error: 'Acesso negado: Requisição não autenticada para o agente local da H.E.L.E.N.A.',
    detalhes: 'Para executar comandos no sistema, forneça o cabeçalho x-helena-auth ou execute a partir de um host local autorizado.'
  });
}

module.exports = {
  getOrCreateLocalToken,
  requireLocalAuth,
  isAuthorizedOrigin
};
