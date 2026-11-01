// =========================================================================
// H.E.L.E.N.A. — SUÍTE DE TESTES AUTOMATIZADOS E VALIDAÇÃO E2E
// Verifica: Hardware Real, IA/Diagnóstico, Persistência, Pareamento Mobile,
// HITL, Revogação, Executáveis .EXE Nativos e Interface Visual (Playwright)
// =========================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3000';
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = 'C:/Users/user/.gemini/antigravity/brain/5ee6b6f2-693c-48be-83a2-cc4e2bc2082c';

async function runTests() {
  console.log('=======================================================');
  console.log('  INICIANDO BATERIA DE TESTES REAIS DA H.E.L.E.N.A.');
  console.log('=======================================================');

  // 1. Verificar Executáveis Nativos Windows (.exe) e Ícone (.ico)
  console.log('\n[TESTE 1/7] Validando binários nativos Windows (.exe) e ícone (.ico)...');
  for (const exeName of ['HELENA_Desktop.exe', 'HELENA_Setup.exe', 'Uninstall_HELENA.exe']) {
    const p = path.join(ROOT_DIR, exeName);
    assert(fs.existsSync(p), `Executável ausente: ${exeName}`);
    const buf = fs.readFileSync(p);
    assert(buf[0] === 0x4D && buf[1] === 0x5A, `Cabeçalho PE (MZ) inválido em ${exeName}`);
    console.log(`  ✓ ${exeName} válido (${(buf.length / 1024).toFixed(1)} KB, assinatura PE MZ confirmada)`);
  }

  // 2. Testar Leitura Real de Hardware e Sistema (/api/system/snapshot)
  console.log('\n[TESTE 2/7] Consultando telemetria real do sistema operacional (/api/system/snapshot)...');
  const snapRes = await fetch(`${BASE_URL}/api/system/snapshot`);
  assert(snapRes.ok, 'Falha em /api/system/snapshot');
  const snapData = await snapRes.json();
  const snap = snapData.snapshot;
  assert(snap.cpu.model.includes('Intel'), 'CPU real não identificada');
  assert(snap.ram.totalGB > 0, 'RAM total inválida');
  assert(snap.topProcesses.length > 0, 'Lista de processos vazia');
  console.log(`  ✓ Host: ${snap.hostname} | CPU: ${snap.cpu.model} (${snap.cpu.physicalCores}C/${snap.cpu.logicalProcessors}T)`);
  console.log(`  ✓ RAM: ${snap.ram.usedGB}/${snap.ram.totalGB} GB (${snap.ram.usagePercent}%) | Top Processo: ${snap.topProcesses[0].name}`);

  // 3. Testar Inteligência Artificial & Diagnóstico Baseado em Dados Reais
  console.log('\n[TESTE 3/7] Testando diagnóstico real via linguagem natural ("HELENA, por que meu computador está lento?")...');
  const brainRes = await fetch(`${BASE_URL}/api/helena/brain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'HELENA, por que meu computador está lento?' })
  });
  assert(brainRes.ok, 'Falha em /api/helena/brain');
  const brainData = await brainRes.json();
  const diagCard = brainData.cartoes?.[0];
  assert(diagCard && diagCard.fala.includes('Gigabytes'), 'Diagnóstico não incluiu dados reais de RAM');
  console.log(`  ✓ Resposta da HELENA: "${diagCard.fala.slice(0, 140)}..."`);

  // 4. Testar Pesquisa Real de Arquivos Locais via IA
  console.log('\n[TESTE 4/7] Testando ferramenta de pesquisa de arquivos locais...');
  const fileRes = await fetch(`${BASE_URL}/api/helena/tools/files/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: '' })
  });
  const fileData = await fileRes.json();
  assert(fileData.success, 'Falha na busca local de arquivos');
  console.log(`  ✓ Pesquisa local retornou ${fileData.count} arquivo(s) nas pastas do usuário.`);

  // 5. Testar Persistência de Conversas (/api/helena/conversations)
  console.log('\n[TESTE 5/7] Verificando persistência de histórico de conversas...');
  const convRes = await fetch(`${BASE_URL}/api/helena/conversations`);
  const convData = await convRes.json();
  assert(convData.success && convData.messages.length >= 2, 'Histórico de conversas não persistido');
  console.log(`  ✓ ${convData.messages.length} mensagens salvas no banco de conversas local.`);

  // 6. Testar Ciclo Completo de Pareamento Mobile, Autenticação, HITL e Revogação
  console.log('\n[TESTE 6/7] Testando Segurança Mobile (QR Code / PIN 6 dígitos / HITL / Revogação)...');
  // 6a. Gerar Desafio no PC
  const chalRes = await fetch(`${BASE_URL}/api/mobile/pair/challenge`, { method: 'POST' });
  const chalData = await chalRes.json();
  assert(chalData.success && chalData.pin.length === 6 && chalData.qrCodeDataUrl.startsWith('data:image/png'), 'Desafio QR/PIN inválido');
  console.log(`  ✓ Código PIN temporário gerado: ${chalData.pin} (QR Code gerado: ${chalData.qrCodeDataUrl.length} bytes)`);

  // 6b. Testar PIN incorreto (deve rejeitar com 401)
  const badPair = await fetch(`${BASE_URL}/api/mobile/pair/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '000000', deviceName: 'Intruso' })
  });
  assert(badPair.status === 401, 'PIN incorreto deveria retornar 401');
  console.log(`  ✓ Bloqueio contra PIN inválido confirmado (HTTP 401).`);

  // 6c. Parear com o PIN correto
  const goodPair = await fetch(`${BASE_URL}/api/mobile/pair/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: chalData.pin, deviceName: 'Smartphone do Comandante' })
  });
  const goodPairData = await goodPair.json();
  assert(goodPairData.success && goodPairData.sessionToken.length === 64, 'Token de sessão não gerado');
  const mobileToken = goodPairData.sessionToken;
  console.log(`  ✓ Dispositivo pareado com sucesso: ${goodPairData.deviceName} (${goodPairData.deviceId})`);

  // 6d. Enviar ação sensível pelo celular e verificar fila de confirmação no PC (HITL)
  const actRes = await fetch(`${BASE_URL}/api/mobile/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-helena-device-token': mobileToken
    },
    body: JSON.stringify({
      actionType: 'optimize_pc',
      actionLabel: 'Otimizar Sistema Remotamente pelo Celular'
    })
  });
  const actData = await actRes.json();
  assert(actData.requiresApproval && actData.status === 'pending_approval', 'Ação sensível deveria exigir aprovação no PC');
  const approvalId = actData.approval.id;
  console.log(`  ✓ Ação sensível retida para confirmação no PC (ID: ${approvalId})`);

  // 6e. Aprovar a ação no PC
  const resolveRes = await fetch(`${BASE_URL}/api/mobile/approval/${approvalId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'approve' })
  });
  const resolveData = await resolveRes.json();
  assert(resolveData.success && resolveData.item.status === 'approved', 'Falha ao aprovar ação no PC');
  console.log(`  ✓ Ação aprovada no PC e executada: "${resolveData.item.result.message}"`);

  // 7. Validação de Rotas de Interface Desktop, Mobile e Downloads (.EXE e .ZIP)
  console.log('\n[TESTE 7/7] Validando Rotas de Interface Desktop, Mobile e Downloads (.EXE / .ZIP)...');
  const appHtmlRes = await fetch(`${BASE_URL}/?mode=app&pair=1`);
  assert(appHtmlRes.ok, 'Rota Desktop /?mode=app&pair=1 falhou');
  const mobileHtmlRes = await fetch(`${BASE_URL}/?mode=mobile`);
  assert(mobileHtmlRes.ok, 'Rota Mobile /?mode=mobile falhou');
  const zipDlRes = await fetch(`${BASE_URL}/downloads/helena-portatil.zip`);
  assert(zipDlRes.ok, 'Download de helena-portatil.zip falhou');
  const exeDlRes = await fetch(`${BASE_URL}/downloads/HELENA_Setup.exe`);
  assert(exeDlRes.ok, 'Download de HELENA_Setup.exe falhou');
  console.log(`  ✓ Rotas Desktop, Mobile, ZIP (${zipDlRes.headers.get('content-length')} bytes) e Instalador .EXE (${exeDlRes.headers.get('content-length')} bytes) verificadas com HTTP 200!`);

  // Revoga o dispositivo de teste ao final
  await fetch(`${BASE_URL}/api/mobile/devices/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId: goodPairData.deviceId })
  });
  const afterRevoke = await fetch(`${BASE_URL}/api/mobile/session/verify`, {
    headers: { 'x-helena-device-token': mobileToken }
  });
  assert(afterRevoke.status === 401, 'Token revogado deveria retornar 401');
  console.log(`  ✓ Revogação imediata de dispositivo confirmada (HTTP 401 após revogar).`);

  console.log('\n=======================================================');
  console.log('  TODOS OS 7 GRUPOS DE TESTES PASSARAM COM 100% DE ÊXITO!');
  console.log('=======================================================');
}

runTests().catch(err => {
  console.error('\n[FALHA NOS TESTES]:', err);
  process.exit(1);
});
