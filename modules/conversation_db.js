// =========================================================================
// H.E.L.E.N.A. — MÓDULO DE PERSISTÊNCIA DE CONVERSAS E CONTEXTO CONTÍNUO
// Armazenamento estruturado de histórico multi-turno (Desktop & Mobile)
// =========================================================================

const fs = require('fs');
const path = require('path');

const RUNTIME_DIR = path.resolve(__dirname, '..', 'runtime');
const CONVERSATIONS_FILE = path.join(RUNTIME_DIR, 'conversations_db.json');

if (!fs.existsSync(RUNTIME_DIR)) {
  try { fs.mkdirSync(RUNTIME_DIR, { recursive: true }); } catch (_) {}
}

function loadConversations() {
  try {
    if (fs.existsSync(CONVERSATIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONVERSATIONS_FILE, 'utf-8'));
      if (Array.isArray(data.messages)) return data;
    }
  } catch (_) {}
  return {
    updatedAt: new Date().toISOString(),
    messages: []
  };
}

function saveConversations(db) {
  try {
    db.updatedAt = new Date().toISOString();
    if (db.messages.length > 200) {
      db.messages = db.messages.slice(-200);
    }
    fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao salvar conversations_db.json:', err.message);
  }
}

function appendConversationTurn({ userText, assistantText, intent = 'geral', toolUsed = null, source = 'DESKTOP', cardTitle = '' }) {
  const db = loadConversations();
  const now = new Date().toISOString();

  if (userText) {
    db.messages.push({
      id: 'msg-u-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      role: 'user',
      content: String(userText).trim(),
      source,
      timestamp: now
    });
  }

  if (assistantText) {
    db.messages.push({
      id: 'msg-a-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      role: 'assistant',
      content: String(assistantText).trim(),
      intent,
      toolUsed,
      cardTitle,
      source,
      timestamp: now
    });
  }

  saveConversations(db);
  return db.messages.slice(-20);
}

function getRecentMessagesForAI(limit = 10) {
  const db = loadConversations();
  return db.messages.slice(-limit).map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));
}

function getConversationHistory(limit = 50) {
  const db = loadConversations();
  return db.messages.slice(-limit);
}

function clearConversationHistory() {
  const empty = { updatedAt: new Date().toISOString(), messages: [] };
  saveConversations(empty);
  return empty;
}

module.exports = {
  appendConversationTurn,
  getRecentMessagesForAI,
  getConversationHistory,
  clearConversationHistory
};
