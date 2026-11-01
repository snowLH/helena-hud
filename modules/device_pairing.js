// =========================================================================
// H.E.L.E.N.A. — MÓDULO DE PAREAMENTO SEGURO MOBILE & CONTROLE DE SESSÕES
// Autenticação por QR Code / PIN Temporário, Revogação, Auditoria e HITL
// =========================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');

const RUNTIME_DIR = path.resolve(__dirname, '..', 'runtime');
const DEVICES_FILE = path.join(RUNTIME_DIR, 'paired_devices.json');
const AUDIT_LOG_FILE = path.join(RUNTIME_DIR, 'security_audit_log.json');

if (!fs.existsSync(RUNTIME_DIR)) {
  try { fs.mkdirSync(RUNTIME_DIR, { recursive: true }); } catch (_) {}
}

// Estado em memória para códigos PIN temporários e aprovações pendentes
let activePairingChallenge = null; // { pin, expiresAt, createdAt }
const pendingApprovals = new Map(); // id -> { id, deviceId, deviceName, actionType, actionLabel, payload, status, createdAt, result }

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

// -------------------------------------------------------------------------
// 1. AUDITORIA DE SEGURANÇA E OPERAÇÕES
// -------------------------------------------------------------------------

function loadAuditLogs() {
  try {
    if (fs.existsSync(AUDIT_LOG_FILE)) {
      return JSON.parse(fs.readFileSync(AUDIT_LOG_FILE, 'utf-8'));
    }
  } catch (_) {}
  return [];
}

function logAuditEvent({ source = 'MOBILE', deviceName = 'Desconhecido', ip = '', action = '', status = 'EXECUTADO', details = '' }) {
  const logs = loadAuditLogs();
  const entry = {
    id: 'audit-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
    source,
    deviceName,
    ip,
    action,
    status,
    details
  };
  logs.unshift(entry);
  const trimmed = logs.slice(0, 150);
  try {
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (_) {}
  return entry;
}

// -------------------------------------------------------------------------
// 2. GERENCIAMENTO DE DISPOSITIVOS PAREADOS
// -------------------------------------------------------------------------

function loadPairedDevices() {
  try {
    if (fs.existsSync(DEVICES_FILE)) {
      return JSON.parse(fs.readFileSync(DEVICES_FILE, 'utf-8'));
    }
  } catch (_) {}
  return [];
}

function savePairedDevices(devices) {
  try {
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2), 'utf-8');
  } catch (_) {}
}

function listPairedDevices() {
  return loadPairedDevices().map(d => ({
    deviceId: d.deviceId,
    deviceName: d.deviceName,
    ip: d.ip,
    pairedAt: d.pairedAt,
    lastActive: d.lastActive,
    status: d.status
  }));
}

// -------------------------------------------------------------------------
// 3. GERAÇÃO DE CÓDIGO TEMPORÁRIO (PIN 6 DÍGITOS) + QR CODE OFICIAL
// -------------------------------------------------------------------------

async function generatePairingChallenge(networkBaseUrl = 'http://localhost:3000') {
  // Gera PIN numérico de 6 dígitos criptograficamente seguro
  const pinNum = crypto.randomInt(100000, 999999);
  const pin = String(pinNum);
  const now = Date.now();
  const expiresAt = now + 5 * 60 * 1000; // Válido por 5 minutos

  activePairingChallenge = {
    pin,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    expiresTimestamp: expiresAt
  };

  const cleanBase = networkBaseUrl.replace(/\/$/, '');
  const pairingUrl = `${cleanBase}/?mode=mobile&pin=${pin}`;

  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await QRCode.toDataURL(pairingUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 260,
      color: {
        dark: '#00f3ff',
        light: '#020617'
      }
    });
  } catch (err) {
    console.error('Erro ao gerar QR Code:', err.message);
  }

  logAuditEvent({
    source: 'HOST_PC',
    deviceName: 'Console Principal',
    ip: '127.0.0.1',
    action: 'GERAR_CODIGO_PAREAMENTO',
    status: 'ATIVO',
    details: `Código temporário gerado (expira em 5 min).`
  });

  return {
    pin,
    pairingUrl,
    qrCodeDataUrl,
    expiresAt: activePairingChallenge.expiresAt
  };
}

function getCurrentPairingStatus() {
  if (!activePairingChallenge) return { active: false };
  if (Date.now() > activePairingChallenge.expiresTimestamp) {
    activePairingChallenge = null;
    return { active: false };
  }
  return {
    active: true,
    pin: activePairingChallenge.pin,
    expiresAt: activePairingChallenge.expiresAt
  };
}

// -------------------------------------------------------------------------
// 4. HANDSHAKE DE PAREAMENTO DO CELULAR
// -------------------------------------------------------------------------

function pairMobileDevice({ pin, deviceName, userAgent, ip }) {
  const cleanPin = String(pin || '').replace(/\D/g, '');

  if (!activePairingChallenge || Date.now() > activePairingChallenge.expiresTimestamp) {
    logAuditEvent({
      source: 'MOBILE',
      deviceName: deviceName || 'Dispositivo Móvel',
      ip,
      action: 'TENTATIVA_PAREAMENTO',
      status: 'EXPIRADO_OU_INEXISTENTE',
      details: 'Tentativa de pareamento sem código temporário ativo no PC.'
    });
    return {
      success: false,
      error: 'Nenhum código de pareamento ativo ou o código expirou. Gere um novo QR Code / PIN na tela do computador.'
    };
  }

  if (cleanPin !== activePairingChallenge.pin) {
    logAuditEvent({
      source: 'MOBILE',
      deviceName: deviceName || 'Dispositivo Móvel',
      ip,
      action: 'TENTATIVA_PAREAMENTO',
      status: 'PIN_INVALIDO',
      details: `PIN incorreto informado (${cleanPin}).`
    });
    return {
      success: false,
      error: 'Código PIN inválido. Verifique os 6 dígitos exibidos no computador.'
    };
  }

  // PIN correto! Invalida o desafio de uso único e cria sessão criptográfica
  activePairingChallenge = null;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const deviceId = 'dev-' + crypto.randomBytes(6).toString('hex');
  const nowIso = new Date().toISOString();

  const friendlyName = (deviceName || '').trim() || parseFriendlyDeviceName(userAgent);

  const devices = loadPairedDevices();
  devices.unshift({
    deviceId,
    deviceName: friendlyName,
    userAgent: (userAgent || '').slice(0, 150),
    ip: ip || 'Rede Local',
    pairedAt: nowIso,
    lastActive: nowIso,
    tokenHash,
    status: 'active'
  });
  savePairedDevices(devices);

  logAuditEvent({
    source: 'MOBILE',
    deviceName: friendlyName,
    ip,
    action: 'DISPOSITIVO_PAREADO',
    status: 'AUTORIZADO',
    details: `Sessão segura iniciada para ${friendlyName} (${deviceId}).`
  });

  return {
    success: true,
    deviceId,
    deviceName: friendlyName,
    sessionToken: rawToken,
    pairedAt: nowIso
  };
}

function parseFriendlyDeviceName(ua = '') {
  const lower = ua.toLowerCase();
  if (lower.includes('iphone')) return 'iPhone (iOS)';
  if (lower.includes('ipad')) return 'iPad (iPadOS)';
  if (lower.includes('android')) {
    const match = ua.match(/Android\s+[\d.]+;\s*([^;)]+)/i);
    return match ? `Smartphone Android (${match[1].trim()})` : 'Smartphone Android';
  }
  return 'Dispositivo Móvel Conectado';
}

// -------------------------------------------------------------------------
// 5. VALIDAÇÃO DE SESSÃO E REVOGAÇÃO DE DISPOSITIVOS
// -------------------------------------------------------------------------

function validateDeviceToken(rawToken, clientIp = '') {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 32) {
    return { valid: false, reason: 'Token ausente ou malformado.' };
  }

  const targetHash = hashToken(rawToken);
  const devices = loadPairedDevices();
  const device = devices.find(d => d.tokenHash === targetHash);

  if (!device) {
    return { valid: false, reason: 'Dispositivo não reconhecido. Realize o pareamento novamente.' };
  }

  if (device.status !== 'active') {
    return { valid: false, reason: 'O acesso deste dispositivo foi revogado pelo computador principal.' };
  }

  // Atualiza lastActive
  device.lastActive = new Date().toISOString();
  if (clientIp) device.ip = clientIp;
  savePairedDevices(devices);

  return {
    valid: true,
    device: {
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      ip: device.ip,
      pairedAt: device.pairedAt,
      lastActive: device.lastActive
    }
  };
}

function revokeDevice(deviceId) {
  const devices = loadPairedDevices();
  const idx = devices.findIndex(d => d.deviceId === deviceId);
  if (idx === -1) {
    return { success: false, error: 'Dispositivo não encontrado.' };
  }

  const target = devices[idx];
  target.status = 'revoked';
  target.revokedAt = new Date().toISOString();
  savePairedDevices(devices);

  logAuditEvent({
    source: 'HOST_PC',
    deviceName: target.deviceName,
    ip: target.ip,
    action: 'REVOGAR_DISPOSITIVO',
    status: 'REVOGADO',
    details: `Dispositivo ${target.deviceName} (${deviceId}) teve o acesso revogado.`
  });

  return {
    success: true,
    deviceId,
    deviceName: target.deviceName,
    message: `Acesso do dispositivo "${target.deviceName}" foi revogado imediatamente.`
  };
}

function removeDevicePermanently(deviceId) {
  let devices = loadPairedDevices();
  devices = devices.filter(d => d.deviceId !== deviceId);
  savePairedDevices(devices);
  return { success: true };
}

// -------------------------------------------------------------------------
// 6. FILA DE APROVAÇÃO NO COMPUTADOR (HUMAN-IN-THE-LOOP PARA AÇÕES SENSÍVEIS)
// -------------------------------------------------------------------------

function createPendingApproval({ device, actionType, actionLabel, payload }) {
  const id = 'req-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex');
  const item = {
    id,
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    ip: device.ip,
    actionType,
    actionLabel,
    payload: payload || {},
    status: 'pending', // 'pending' | 'approved' | 'denied'
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    result: null
  };

  pendingApprovals.set(id, item);

  logAuditEvent({
    source: 'MOBILE',
    deviceName: device.deviceName,
    ip: device.ip,
    action: actionType,
    status: 'AGUARDANDO_APROVACAO_PC',
    details: `Solicitação remota: "${actionLabel}" aguardando confirmação no computador.`
  });

  return item;
}

function listPendingApprovals() {
  const list = [];
  for (const item of pendingApprovals.values()) {
    list.push(item);
  }
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getApprovalById(id) {
  return pendingApprovals.get(id) || null;
}

async function resolveApproval(id, decision, executorCallback) {
  const item = pendingApprovals.get(id);
  if (!item) {
    return { success: false, error: 'Solicitação não encontrada ou já processada.' };
  }

  if (item.status !== 'pending') {
    return { success: false, error: `Solicitação já foi ${item.status === 'approved' ? 'aprovada' : 'negada'}.` };
  }

  item.resolvedAt = new Date().toISOString();

  if (decision === 'approve') {
    item.status = 'approved';
    try {
      const execResult = executorCallback ? await executorCallback(item) : { message: 'Ação autorizada.' };
      item.result = execResult;
      logAuditEvent({
        source: 'HOST_PC',
        deviceName: item.deviceName,
        ip: item.ip,
        action: item.actionType,
        status: 'APROVADO_E_EXECUTADO',
        details: `Aprovado no PC: "${item.actionLabel}".`
      });
      return { success: true, item };
    } catch (err) {
      item.result = { error: err.message };
      return { success: false, error: err.message, item };
    }
  } else {
    item.status = 'denied';
    item.result = { message: 'Operação negada pelo operador no computador principal.' };
    logAuditEvent({
      source: 'HOST_PC',
      deviceName: item.deviceName,
      ip: item.ip,
      action: item.actionType,
      status: 'NEGADO_PELO_PC',
      details: `Negado no PC: "${item.actionLabel}".`
    });
    return { success: true, item };
  }
}

module.exports = {
  generatePairingChallenge,
  getCurrentPairingStatus,
  pairMobileDevice,
  validateDeviceToken,
  listPairedDevices,
  revokeDevice,
  removeDevicePermanently,
  createPendingApproval,
  listPendingApprovals,
  getApprovalById,
  resolveApproval,
  loadAuditLogs,
  logAuditEvent
};
