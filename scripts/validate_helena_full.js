// =========================================================================
// H.E.L.E.N.A. — SUÍTE COMPLETA DE TESTES AUTOMATIZADOS E2E (FASES 1 A 8)
// Verifica:
//  1. Executáveis Nativos Windows (.EXE) e Ícone (.ICO)
//  2. Modos de Operação Desktop (Modo 1 Background vs Modo 2 HUD)
//  3. Telemetria Real de Hardware (CPU, RAM, Disco, GPU, Processos)
//  4. Ativação por Voz Permanente — Wake Word ("HELENA") & Sensibilidade
//  5. Os 6 Comandos de Voz Obrigatórios da Seção 4 (Execução Real no SO)
//  6. HELENA Core — Decomposição Multiagente ("quero desenvolver um aplicativo...")
//  7. Memória Persistente Estruturada & Isolamento de Privacidade por Agente
//  8. Ferramentas Validadas (CONSULTAR/PREPARAR/EXECUTAR/CONFIRMAR) & Permissões
//  9. Sistema Multiagente (4 Funcionários + Orquestrador) & Escritório 3D
// 10. Persistência de Histórico de Conversas
// 11. Controle Mobile Seguro (QR Code / PIN 6 dígitos / HITL / Revogação)
// 12. Rotas Desktop, 3D Office, Mobile e Pacotes de Instalação (.EXE / .ZIP)
// =========================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';
const ROOT_DIR = path.resolve(__dirname, '..');

async function runTests() {
  console.log('=======================================================');
  console.log('  INICIANDO BATERIA DE TESTES REAIS DA H.E.L.E.N.A. (12 SUÍTES)');
  console.log('=======================================================');

  // 1. Verificar Executáveis Nativos Windows (.exe) e Ícone (.ico)
  console.log('\n[TESTE 1/12] Validando binários nativos Windows (.exe) e ícone (.ico)...');
  for (const exeName of ['HELENA_Desktop.exe', 'HELENA_Setup.exe', 'Uninstall_HELENA.exe']) {
    const p = path.join(ROOT_DIR, exeName);
    assert(fs.existsSync(p), `Executável ausente: ${exeName}`);
    const buf = fs.readFileSync(p);
    assert(buf[0] === 0x4D && buf[1] === 0x5A, `Cabeçalho PE (MZ) inválido em ${exeName}`);
    console.log(`  ✓ ${exeName} válido (${(buf.length / 1024).toFixed(1)} KB, assinatura PE MZ confirmada)`);
  }

  // 2. Testar Modos de Operação Desktop (Modo 1 Background vs Modo 2 HUD)
  console.log('\n[TESTE 2/12] Validando Modos de Operação Desktop (Modo 1 --background vs Modo 2 HUD)...');
  const dCfgRes = await fetch(`${BASE_URL}/api/system/desktop-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startupMode: 'background', keepAliveOnWindowClose: true, minimizeToTray: true })
  });
  assert(dCfgRes.ok, 'Falha em POST /api/system/desktop-config');
  const dCfgData = await dCfgRes.json();
  assert(dCfgData.success && dCfgData.desktopConfig.startupMode === 'background', 'Modo 1 background não salvo');
  console.log(`  ✓ Modo de inicialização configurado: ${dCfgData.desktopConfig.startupMode} | KeepAlive: ${dCfgData.desktopConfig.keepAliveOnWindowClose}`);

  // 3. Testar Leitura Real de Hardware e Sistema (/api/system/snapshot)
  console.log('\n[TESTE 3/12] Consultando telemetria real do sistema operacional (/api/system/snapshot)...');
  const snapRes = await fetch(`${BASE_URL}/api/system/snapshot`);
  assert(snapRes.ok, 'Falha em /api/system/snapshot');
  const snapData = await snapRes.json();
  const snap = snapData.snapshot;
  assert(snap.cpu.model.includes('Intel'), 'CPU real não identificada');
  assert(snap.ram.totalGB > 0, 'RAM total inválida');
  assert(snap.topProcesses.length > 0, 'Lista de processos vazia');
  console.log(`  ✓ Host: ${snap.hostname} | CPU: ${snap.cpu.model} (${snap.cpu.physicalCores}C/${snap.cpu.logicalProcessors}T)`);
  console.log(`  ✓ RAM: ${snap.ram.usedGB}/${snap.ram.totalGB} GB (${snap.ram.usagePercent}%) | Top Processo: ${snap.topProcesses[0].name}`);

  // 4. Testar Wake Word ("HELENA") Status & Configuração
  console.log('\n[TESTE 4/12] Validando Serviço Permanente de Wake Word ("HELENA")...');
  const wwStatusRes = await fetch(`${BASE_URL}/api/wakeword/status`);
  assert(wwStatusRes.ok, 'Falha em GET /api/wakeword/status');
  const wwStatus = await wwStatusRes.json();
  assert(wwStatus.config.wakeWord === 'HELENA', 'Wake word principal incorreta');
  const wwCfgRes = await fetch(`${BASE_URL}/api/wakeword/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: true, sensitivity: 0.8, noiseSuppression: true })
  });
  const wwCfg = await wwCfgRes.json();
  assert(wwCfg.config.sensitivity === 0.8, 'Sensibilidade não atualizada');
  console.log(`  ✓ Wake Word "${wwCfg.config.wakeWord}" ativa | Sensibilidade: ${wwCfg.config.sensitivity * 100}% | Dispositivos de áudio: ${wwStatus.audioDevices.length}`);

  // 5. Testar os 6 Comandos de Voz Obrigatórios da Seção 4 via Wake Word
  console.log('\n[TESTE 5/12] Executando os 6 Comandos de Voz Obrigatórios da Seção 4 via Wake Word...');
  const requiredVoiceCommands = [
    { phrase: 'HELENA, abra o Discord.', expectedIntent: 'launch_app' },
    { phrase: 'HELENA, organize minha pasta de Downloads.', expectedIntent: 'organizador_arquivos' },
    { phrase: 'HELENA, verifique o desempenho do meu computador.', expectedIntent: 'performance_check' },
    { phrase: 'HELENA, pesquise sobre inteligência artificial.', expectedIntent: 'search' },
    { phrase: 'HELENA, crie uma pasta chamada Projetos.', expectedIntent: 'create_folder' },
    { phrase: 'HELENA, abra meu projeto no Antigravity.', expectedIntent: 'launch_app' }
  ];

  for (const item of requiredVoiceCommands) {
    const trigRes = await fetch(`${BASE_URL}/api/wakeword/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: item.phrase, source: 'e2e_test_suite', speakInBackground: false })
    });
    assert(trigRes.ok, `Falha ao disparar comando de voz: ${item.phrase}`);
    const trigData = await trigRes.json();
    assert(trigData.triggered, `Wake Word não disparou para: ${item.phrase}`);
    assert(trigData.brainResponse?.intent === item.expectedIntent, `Intent esperado ${item.expectedIntent}, obtido ${trigData.brainResponse?.intent} para "${item.phrase}"`);
    console.log(`  ✓ Comando "${item.phrase}" -> Intent [${trigData.brainResponse.intent}] -> "${trigData.entry.responseSummary.slice(0, 95)}..."`);
  }

  // Verificar que a pasta "Projetos" foi realmente criada no sistema de arquivos
  const createFolderCheckRes = await fetch(`${BASE_URL}/api/helena/brain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'HELENA, crie uma pasta chamada Projetos.' })
  });
  const createFolderCheck = await createFolderCheckRes.json();
  assert(createFolderCheck.pastaCriada?.path && fs.existsSync(createFolderCheck.pastaCriada.path), 'Pasta "Projetos" não foi criada fisicamente no disco');
  console.log(`  ✓ Pasta física verificada no disco: ${createFolderCheck.pastaCriada.path}`);

  // 6. Testar HELENA Core — Planejamento e Decomposição Multiagente (Seção 5)
  console.log('\n[TESTE 6/12] Testando Planejamento Multiagente ("HELENA, quero desenvolver um aplicativo para organizar meus estudos")...');
  const missionRes = await fetch(`${BASE_URL}/api/helena/brain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'HELENA, quero desenvolver um aplicativo para organizar meus estudos' })
  });
  assert(missionRes.ok, 'Falha na missão multiagente');
  const missionData = await missionRes.json();
  assert(missionData.intent === 'multiagent_mission', 'Deveria acionar intent multiagent_mission');
  assert(Array.isArray(missionData.missionPlan?.tasksCreated) && missionData.missionPlan.tasksCreated.length === 4, 'Deveria decompor em 4 tarefas para os agentes especialistas');
  console.log(`  ✓ Objetivo decomposto em ${missionData.missionPlan.tasksCreated.length} tarefas reais atribuídas a ATHENA-EDU, FORGE-DEV, VAULT-FS e VERITAS-QA.`);

  // 7. Testar Memória Persistente Estruturada & Controles de Privacidade (Seção 6)
  console.log('\n[TESTE 7/12] Validando Memória Persistente Estruturada e Escopo de Privacidade...');
  await fetch(`${BASE_URL}/api/memory/structured/item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'authorizedInfo',
      item: { label: 'Stack Favorita', content: 'TypeScript + React + Node.js', shareWithAgents: false }
    })
  });
  const memSnapRes = await fetch(`${BASE_URL}/api/memory/structured`);
  const memSnap = await memSnapRes.json();
  assert(Array.isArray(memSnap.projects) && memSnap.projects.length > 0, 'Projetos não salvos na memória estruturada');
  assert(Array.isArray(memSnap.executionHistory) && memSnap.executionHistory.length >= 6, 'Histórico de execuções não registrado');
  const scopedRes = await fetch(`${BASE_URL}/api/memory/agent-context/builder`);
  const scopedData = await scopedRes.json();
  assert(scopedData.scopedContext && Array.isArray(scopedData.scopedContext.projects), 'Contexto filtrado por agente inválido');
  console.log(`  ✓ Memória Estruturada ativa: ${memSnap.projects.length} projetos, ${memSnap.decisions.length} decisões, ${memSnap.executionHistory.length} execuções auditadas.`);

  // 8. Testar Ferramentas Validadas (CONSULTAR/PREPARAR/EXECUTAR/CONFIRMAR) e Permissões por Agente (Seções 7 & 8)
  console.log('\n[TESTE 8/12] Validando Permissões de Ferramentas por Agente e Fases de Confirmação...');
  // Agente academic não tem permissão para criar pastas (apenas orchestrator, archivist, builder)
  const deniedToolRes = await fetch(`${BASE_URL}/api/helena/tools/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: 'academic',
      toolName: 'folder_create',
      params: { folderName: 'TesteNegado', parentScope: 'desktop' }
    })
  });
  const deniedTool = await deniedToolRes.json();
  assert(deniedTool.success === false && deniedTool.phase === 'PREPARAR', 'Agente sem permissão deveria ser bloqueado na fase PREPARAR');
  console.log(`  ✓ Bloqueio de permissão por agente confirmado: [${deniedTool.error}]`);

  // Ferramenta destrutiva sem confirmação deve parar na fase CONFIRMAR
  const confirmToolRes = await fetch(`${BASE_URL}/api/helena/tools/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentId: 'orchestrator',
      toolName: 'process_terminate',
      params: { pid: 999999, name: 'dummy.exe' },
      confirmed: false
    })
  });
  const confirmTool = await confirmToolRes.json();
  assert(confirmTool.requiresConfirmation === true && confirmTool.phase === 'CONFIRMAR', 'Ação crítica deveria exigir confirmação explícita');
  console.log(`  ✓ Salvaguarda de confirmação (Fase CONFIRMAR) validada para ferramentas críticas.`);

  // 9. Testar Sistema Multiagente & Painel de Controle do Escritório 3D (Seção 9)
  console.log('\n[TESTE 9/12] Validando Estado do Escritório 3D Holográfico e Registro Central de Tarefas...');
  const ecoRes = await fetch(`${BASE_URL}/api/ecosystem/state`);
  assert(ecoRes.ok, 'Falha em /api/ecosystem/state');
  const ecoData = await ecoRes.json();
  const agentKeys = Object.keys(ecoData.agents || {});
  assert(agentKeys.includes('orchestrator') && agentKeys.includes('academic') && agentKeys.includes('archivist') && agentKeys.includes('builder') && agentKeys.includes('reviewer'), 'Os 5 agentes do ecossistema devem estar presentes');
  assert(ecoData.officeControl && typeof ecoData.officeControl.totalAgents === 'number', 'Painel de controle do escritório ausente');
  console.log(`  ✓ Escritório 3D sincronizado: ${ecoData.officeControl.totalAgents} agentes, ${ecoData.officeControl.collaborations.length} colaborações, ${ecoData.officeControl.activityHistory.length} eventos registrados.`);

  // 10. Testar Persistência de Conversas (/api/helena/conversations)
  console.log('\n[TESTE 10/12] Verificando persistência de histórico de conversas...');
  const convRes = await fetch(`${BASE_URL}/api/helena/conversations`);
  const convData = await convRes.json();
  assert(convData.success && convData.messages.length >= 2, 'Histórico de conversas não persistido');
  console.log(`  ✓ ${convData.messages.length} mensagens salvas no banco de conversas local.`);

  // 11. Testar Ciclo Completo de Pareamento Mobile, Autenticação, HITL e Revogação
  console.log('\n[TESTE 11/12] Testando Segurança Mobile (QR Code / PIN 6 dígitos / HITL / Revogação)...');
  const chalRes = await fetch(`${BASE_URL}/api/mobile/pair/challenge`, { method: 'POST' });
  const chalData = await chalRes.json();
  assert(chalData.success && chalData.pin.length === 6 && chalData.qrCodeDataUrl.startsWith('data:image/png'), 'Desafio QR/PIN inválido');

  const badPair = await fetch(`${BASE_URL}/api/mobile/pair/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '000000', deviceName: 'Intruso' })
  });
  assert(badPair.status === 401, 'PIN incorreto deveria retornar 401');

  const goodPair = await fetch(`${BASE_URL}/api/mobile/pair/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: chalData.pin, deviceName: 'Smartphone do Comandante' })
  });
  const goodPairData = await goodPair.json();
  assert(goodPairData.success && goodPairData.sessionToken.length === 64, 'Token de sessão não gerado');
  const mobileToken = goodPairData.sessionToken;

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

  const resolveRes = await fetch(`${BASE_URL}/api/mobile/approval/${approvalId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'approve' })
  });
  const resolveData = await resolveRes.json();
  assert(resolveData.success && resolveData.item.status === 'approved', 'Falha ao aprovar ação no PC');

  await fetch(`${BASE_URL}/api/mobile/devices/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId: goodPairData.deviceId })
  });
  const afterRevoke = await fetch(`${BASE_URL}/api/mobile/session/verify`, {
    headers: { 'x-helena-device-token': mobileToken }
  });
  assert(afterRevoke.status === 401, 'Token revogado deveria retornar 401');
  console.log(`  ✓ Pareamento PIN/QR, aprovação HITL no PC e revogação imediata (HTTP 401) validados.`);

  // 12. Validação de Rotas de Interface Desktop, 3D Office, Mobile e Downloads (.EXE e .ZIP)
  console.log('\n[TESTE 12/12] Validando Rotas Desktop, Escritório 3D, Mobile e Downloads (.EXE / .ZIP)...');
  const appHtmlRes = await fetch(`${BASE_URL}/?mode=app`);
  assert(appHtmlRes.ok, 'Rota Desktop /?mode=app falhou');
  const office3dRes = await fetch(`${BASE_URL}/?mode=app&view=3d`);
  assert(office3dRes.ok, 'Rota Escritório 3D /?mode=app&view=3d falhou');
  const mobileHtmlRes = await fetch(`${BASE_URL}/?mode=mobile`);
  assert(mobileHtmlRes.ok, 'Rota Mobile /?mode=mobile falhou');
  const zipDlRes = await fetch(`${BASE_URL}/downloads/helena-portatil.zip`);
  assert(zipDlRes.ok, 'Download de helena-portatil.zip falhou');
  const exeDlRes = await fetch(`${BASE_URL}/downloads/HELENA_Setup.exe`);
  assert(exeDlRes.ok, 'Download de HELENA_Setup.exe falhou');
  console.log(`  ✓ Rotas HUD, 3D Office, Mobile, ZIP (${zipDlRes.headers.get('content-length')} bytes) e Instalador .EXE (${exeDlRes.headers.get('content-length')} bytes) verificadas com HTTP 200!`);

  console.log('\n=======================================================');
  console.log('  TODAS AS 12 SUÍTES DE TESTES E2E PASSARAM COM 100% DE ÊXITO!');
  console.log('=======================================================');
}

runTests().catch(err => {
  console.error('\n[FALHA NOS TESTES]:', err);
  process.exit(1);
});
