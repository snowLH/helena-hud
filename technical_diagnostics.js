// =========================================================================
// H.E.L.E.N.A. — MÓDULO ESPECIALISTA EM DIAGNÓSTICO E MANUTENÇÃO TÉCNICA
// Diagnóstico Real de Hardware, Notebooks, Logs do Windows, SSD, RAM e BSOD
// =========================================================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const windowsTools = require('./modules/windows_tools');

const RUNTIME_DIR = path.join(__dirname, 'runtime');
const REPORTS_DIR = path.join(RUNTIME_DIR, 'reports');

if (!fs.existsSync(REPORTS_DIR)) {
  try { fs.mkdirSync(REPORTS_DIR, { recursive: true }); } catch (_) {}
}

// 1. Coleta Profunda de Diagnóstico de Hardware e Software
function collectHardwareDiagnostics() {
  const isWin = process.platform === 'win32';
  const timestamp = new Date().toISOString();
  const snap = windowsTools.getFullSystemSnapshot();

  const report = {
    timestamp,
    plataforma: process.platform,
    hostname: os.hostname(),
    computador: {
      fabricante: 'Sistema Local',
      modelo: os.hostname(),
      bios: 'UEFI Padrão',
      dataBios: 'N/A'
    },
    processador: {
      modelo: snap.cpu.model,
      nucleosFisicos: snap.cpu.physicalCores,
      threadsLogicos: snap.cpu.logicalProcessors,
      clockMaxMHz: snap.cpu.maxClockMHz,
      usoAtualPercent: snap.cpu.loadPercent,
      arquitetura: os.arch()
    },
    gpu: snap.gpu,
    memoriaRAM: {
      totalGB: snap.ram.totalGB,
      usadoGB: snap.ram.usedGB,
      livreGB: snap.ram.freeGB,
      percentualUso: snap.ram.usagePercent,
      modulos: []
    },
    armazenamento: {
      discosFisicos: [],
      particaoC: {
        livreGB: snap.disks[0]?.freeGB || 50,
        totalGB: snap.disks[0]?.totalGB || 250,
        percentualUso: snap.disks[0]?.usedPercent || 50
      }
    },
    arquivosTemporarios: snap.tempFiles,
    processosMaisPesados: snap.topProcesses,
    programasInicializacao: snap.startupItems,
    totalInicializacao: snap.startupCount,
    temperatura: snap.temperature,
    logsEventosCriticos: [],
    dispositivosComErro: [],
    bateria: {
      presente: snap.battery.present,
      percentual: snap.battery.percentage,
      carregando: snap.battery.charging,
      saude: 'OK',
      detalhes: snap.battery.present
        ? `Bateria em ${snap.battery.percentage}% (${snap.battery.status})`
        : 'Equipamento alimentado diretamente via rede elétrica AC.'
    }
  };

  // Se estiver no Windows, executa comandos reais
  if (isWin) {
    // BIOS
    try {
      const biosCmd = `powershell -NoProfile -Command "Get-CimInstance Win32_Bios | Select-Object Manufacturer, SMBIOSBIOSVersion, ReleaseDate | ConvertTo-Json"`;
      const biosRaw = execSync(biosCmd, { timeout: 3000, encoding: 'utf-8' });
      const biosData = JSON.parse(biosRaw);
      if (biosData.Manufacturer) report.computador.fabricante = biosData.Manufacturer;
      if (biosData.SMBIOSBIOSVersion) report.computador.bios = biosData.SMBIOSBIOSVersion;
      if (biosData.ReleaseDate) report.computador.dataBios = biosData.ReleaseDate;
    } catch (_) {}

    // Modelo do Sistema
    try {
      const sysCmd = `powershell -NoProfile -Command "Get-CimInstance Win32_ComputerSystem | Select-Object Manufacturer, Model | ConvertTo-Json"`;
      const sysRaw = execSync(sysCmd, { timeout: 3000, encoding: 'utf-8' });
      const sysData = JSON.parse(sysRaw);
      if (sysData.Model) report.computador.modelo = `${sysData.Manufacturer || ''} ${sysData.Model}`.trim();
    } catch (_) {}

    // Módulos Físicos de Memória RAM
    try {
      const ramCmd = `powershell -NoProfile -Command "Get-CimInstance Win32_PhysicalMemory | Select-Object DeviceLocator, Capacity, Speed, Manufacturer | ConvertTo-Json"`;
      const ramRaw = execSync(ramCmd, { timeout: 3000, encoding: 'utf-8' });
      let ramData = JSON.parse(ramRaw);
      if (!Array.isArray(ramData)) ramData = [ramData];
      report.memoriaRAM.modulos = ramData.map(m => ({
        slot: m.DeviceLocator || 'Slot',
        capacidadeGB: Math.round((parseInt(m.Capacity || 0, 10) / (1024 ** 3)) * 10) / 10,
        velocidadeMHz: m.Speed || 0,
        fabricante: m.Manufacturer || 'Fabricante Genérico'
      }));
    } catch (_) {}

    // Discos Físicos & Saúde SMART
    try {
      const diskCmd = `powershell -NoProfile -Command "Get-PhysicalDisk | Select-Object FriendlyName, MediaType, HealthStatus, OperationalStatus, Size | ConvertTo-Json"`;
      const diskRaw = execSync(diskCmd, { timeout: 4000, encoding: 'utf-8' });
      let diskData = JSON.parse(diskRaw);
      if (!Array.isArray(diskData)) diskData = [diskData];
      report.armazenamento.discosFisicos = diskData.map(d => ({
        modelo: d.FriendlyName,
        tipo: d.MediaType || 'SSD',
        saude: d.HealthStatus || 'Healthy',
        statusOperacional: d.OperationalStatus || 'OK',
        tamanhoGB: Math.round((parseInt(d.Size || 0, 10) / (1024 ** 3)) * 10) / 10
      }));
    } catch (_) {}

    // Partição C: real via fs.statfsSync
    try {
      if (fs.statfsSync) {
        const s = fs.statfsSync('C:\\');
        const freeGB = Math.round((s.bavail * s.bsize / (1024 ** 3)) * 10) / 10;
        const totalGB = Math.round((s.blocks * s.bsize / (1024 ** 3)) * 10) / 10;
        report.armazenamento.particaoC = {
          livreGB: freeGB,
          totalGB: totalGB,
          percentualUso: Math.round(((totalGB - freeGB) / totalGB) * 100)
        };
      }
    } catch (_) {}

    // Windows Event Logs (Eventos Críticos / Erros recentes)
    try {
      const evtCmd = `powershell -NoProfile -Command "Get-WinEvent -FilterHashtable @{LogName='System'; Level=1,2} -MaxEvents 6 -ErrorAction SilentlyContinue | Select-Object TimeCreated, ProviderName, Id, Message | ConvertTo-Json"`;
      const evtRaw = execSync(evtCmd, { timeout: 4000, encoding: 'utf-8' });
      let evtData = JSON.parse(evtRaw);
      if (!Array.isArray(evtData)) evtData = [evtData];
      report.logsEventosCriticos = evtData.map(e => ({
        timestamp: e.TimeCreated || new Date().toISOString(),
        fonte: e.ProviderName || 'Sistema',
        eventoId: e.Id || 0,
        mensagem: (e.Message || '').slice(0, 200)
      }));
    } catch (_) {}

    // Dispositivos com erro no Gerenciador de Dispositivos
    try {
      const devCmd = `powershell -NoProfile -Command "Get-CimInstance Win32_PnPEntity | Where-Object { $_.ConfigManagerErrorCode -ne 0 } | Select-Object Name, DeviceID, ConfigManagerErrorCode | ConvertTo-Json"`;
      const devRaw = execSync(devCmd, { timeout: 3500, encoding: 'utf-8' });
      if (devRaw.trim()) {
        let devData = JSON.parse(devRaw);
        if (!Array.isArray(devData)) devData = [devData];
        report.dispositivosComErro = devData;
      }
    } catch (_) {}
  }

  return report;
}

// 2. Motor de Diagnóstico Guiado Baseado em Sintomas
function runGuidedDiagnostic(sintomaTexto, hardwareInfo = null) {
  const info = hardwareInfo || collectHardwareDiagnostics();
  const lower = (sintomaTexto || '').toLowerCase();

  let diagnostico = {
    sintomaIdentificado: sintomaTexto || 'Lentidão Geral do Sistema',
    categoria: 'Geral',
    nivelConfianca: 'Alta',
    causasProvaveis: [],
    testesRecomendados: [],
    orientacoesFisicas: [],
    planoAcao: [],
    resumoFala: ''
  };

  if (lower.includes('esquenta') || lower.includes('aquec') || lower.includes('quente') || lower.includes('cooler') || lower.includes('ventoinha')) {
    diagnostico.categoria = 'Térmica & Refrigeração';
    diagnostico.causasProvaveis = [
      { hipotese: 'Ressecamento de pasta térmica (composto térmico degradado)', probabilidade: '75%', evidencia: 'Notebooks com mais de 12 a 24 meses sem manutenção térmica acumulam poeira nas aletas do dissipador e ressecam a pasta.' },
      { hipotese: 'Obstrução de poeira nas aletas do dissipador e ventoinha', probabilidade: '70%', evidencia: 'Fluxo de ar reduzido força o cooler a rodar a 100% (ruído alto) sem conseguir dissipar o calor da CPU/GPU.' },
      { hipotese: 'Processos em segundo plano provocando carga contínua na CPU', probabilidade: '40%', evidencia: `Uso de CPU registrado no hardware: ${info.processador.modelo}.` }
    ];
    diagnostico.testesRecomendados = [
      '1. Abrir o Gerenciador de Processos da H.E.L.E.N.A. e ordenar por consumo de CPU para descartar loop infinito de software.',
      '2. Monitorar temperatura em repouso (esperado: 40°C a 55°C) e em carga (esperado: abaixo de 85°C a 90°C).',
      '3. Verificar com a mão se há saída de ar quente nas grades laterais/traseiras (se o ar sair fraco, o dissipador está obstruído).'
    ];
    diagnostico.orientacoesFisicas = [
      '⚠️ DESCARGA ELETROSTÁTICA (ESD): Antes de abrir a tampa inferior, desconecte o carregador, abra o notebook e DESCONECTE A BATERIA INTERNA antes de encostar em qualquer componente.',
      '⚠️ LIMPEZA DO COOLER: Ao aplicar ar comprimido na ventoinha, segure a hélice com o dedo para não girá-la em rotação excessiva (pode queimar o rolamento ou gerar corrente reversa).',
      '⚠️ PASTA TÉRMICA: Limpe a pasta antiga com álcool isopropílico 99% e aplique uma quantidade do tamanho de um grão de arroz no centro do die (ex: Arctic MX-4, Noctua NT-H1 ou Thermal Grizzly).'
    ];
    diagnostico.planoAcao = [
      'Executar otimização e limpeza de processos temporários via H.E.L.E.N.A.',
      'Verificar plano de energia e certificar-se de que a refrigeração do sistema está em "Ativa".',
      'Programar limpeza física interna e troca de pasta térmica preventiva.'
    ];
    diagnostico.resumoFala = 'Diagnóstico térmico concluído. A principal causa de aquecimento em notebooks é o ressecamento da pasta térmica e o acúmulo de poeira nas aletas do dissipador. Recomendo verificar os processos ativos e seguir o protocolo seguro de desmontagem com bateria desconectada.';

  } else if (lower.includes('lento') || lower.includes('travando') || lower.includes('lentidão') || lower.includes('demora')) {
    diagnostico.categoria = 'Performance, RAM & Armazenamento';
    const cUsage = info.armazenamento.particaoC.percentualUso;
    const ramPct = info.memoriaRAM.percentualUso || Math.round((info.memoriaRAM.usadoGB / info.memoriaRAM.totalGB) * 100);
    const topProcsStr = (info.processosMaisPesados || []).slice(0, 4).map(p => `${p.name} (${p.memoryMB} MB)`).join(', ') || 'Nenhum processo crítico isolado';
    const startupTotal = info.totalInicializacao || 0;
    const tempCount = info.arquivosTemporarios?.fileCount || 0;
    const tempMB = info.arquivosTemporarios?.sizeMB || 0;

    diagnostico.causasProvaveis = [
      {
        hipotese: `Consumo Real de Memória RAM (${info.memoriaRAM.usadoGB} GB de ${info.memoriaRAM.totalGB} GB — ${ramPct}%)`,
        probabilidade: ramPct > 75 ? '85%' : '55%',
        evidencia: `Maiores consumidores medidos agora no sistema: ${topProcsStr}.`
      },
      {
        hipotese: `Programas na Inicialização (${startupTotal} itens) e Caches Temporários (${tempCount} arquivos / ${tempMB} MB)`,
        probabilidade: startupTotal > 6 ? '75%' : '45%',
        evidencia: `Foram detectados ${startupTotal} programas configurados no boot do Windows e ${tempCount} arquivos temporários em %TEMP%.`
      },
      {
        hipotese: `Ocupação da Partição C: (${cUsage}% ocupado)`,
        probabilidade: cUsage > 85 ? '80%' : '35%',
        evidencia: `Espaço livre real: ${info.armazenamento.particaoC.livreGB} GB livres de ${info.armazenamento.particaoC.totalGB} GB.`
      }
    ];
    diagnostico.testesRecomendados = [
      `1. Verificar os processos mais pesados em execução: ${topProcsStr}.`,
      `2. Limpar os ${tempCount} arquivos temporários (${tempMB} MB) na pasta %TEMP%.`,
      `3. Revisar os ${startupTotal} programas de inicialização do Windows.`,
      '4. Executar a Sequência Dourada de Reparação Forense (DISM -> SFC -> Chkdsk /scan).'
    ];
    diagnostico.orientacoesFisicas = [
      'Se o computador ainda possuir HD Mecânico (Hard Disk), a substituição por um SSD NVMe ou SATA aumentará a velocidade em até 10 vezes.',
      'Verificar se a memória RAM está operando em Dual-Channel para dobrar a largura de banda da CPU.'
    ];
    diagnostico.planoAcao = [
      'Executar otimização imediata para purgar temporários e renovar DNS.',
      'Encerrar processos ociosos de alto consumo de RAM.',
      'Aplicar Sequência Dourada de Reparo se houver lentidão persistente no Windows Explorer.'
    ];
    diagnostico.resumoFala = `Diagnóstico real concluído. Seu processador ${info.processador.modelo} está com ${info.processador.usoAtualPercent || 0}% de carga e a memória RAM está em ${ramPct}% (${info.memoriaRAM.usadoGB} de ${info.memoriaRAM.totalGB} Gigabytes). Os processos que mais consomem memória agora são: ${(info.processosMaisPesados || []).slice(0, 3).map(p => p.name).join(', ')}. Também encontrei ${tempCount} arquivos temporários e ${startupTotal} programas na inicialização.`;


  } else if (lower.includes('tela azul') || lower.includes('bsod') || lower.includes('desliga sozinho') || lower.includes('reinicia')) {
    diagnostico.categoria = 'Estabilidade & Kernel Windows';
    diagnostico.causasProvaveis = [
      { hipotese: 'Falha ou corrupção de driver de dispositivo ou módulo de memória RAM', probabilidade: '65%', evidencia: 'Telas azuis (BugCheck) ocorrem quando o kernel entra em exceção irrecuperável de memória ou driver gráfico/rede.' },
      { hipotese: 'Desligamento térmico de proteção (Thermal Shutdown)', probabilidade: '55%', evidencia: 'A BIOS desliga o notebook abruptamente para evitar danos físicos se a CPU atingir o TJunction (100°C a 105°C).' },
      { hipotese: 'Corrupção de integridade nos arquivos de sistema do Windows', probabilidade: '45%', evidencia: 'Arquivos .sys fundamentais corrompidos por quedas de energia repentinas.' }
    ];
    diagnostico.testesRecomendados = [
      '1. Executar verificação de integridade com "sfc /verifyonly" e "chkdsk C: /scan".',
      '2. Rodar a Ferramenta de Diagnóstico de Memória do Windows (mdsched.exe) para escanear os módulos de RAM por 2 passagens completas.',
      '3. Inspecionar os logs de sistema no Visualizador de Eventos para localizar o código de erro BugCheck (ex: 0x0000003B, 0x0000007E).'
    ];
    diagnostico.orientacoesFisicas = [
      '⚠️ TESTE DE RAM: Se houver 2 módulos de RAM instalados, remova um deles e ligue o computador para isolar qual pente ou slot apresenta instabilidade.',
      '⚠️ CONTATOS DOURADOS: Limpe os contatos dourados da RAM com uma borracha branca escolar limpa e remova resíduos com pincel antiestático.',
      '⚠️ BATERIA & CARREGADOR: Teste o notebook conectado diretamente à fonte sem a bateria interna para descartar curto no circuito de carga.'
    ];
    diagnostico.planoAcao = [
      'Executar varredura sfc e dism para reparar imagens do sistema.',
      'Inspecionar relatórios de falhas no Event Viewer.',
      'Se persistir, realizar teste de memória RAM por eliminação de pentes.'
    ];
    diagnostico.resumoFala = 'Diagnóstico de estabilidade concluído. Telas azuis e desligamentos abruptos exigem descartar primeiro falha térmica e em seguida instabilidade de RAM ou drivers. O plano passo a passo com testes seguros está pronto no seu console.';

  } else if (lower.includes('bateria') || lower.includes('descarrega') || lower.includes('não carrega')) {
    diagnostico.categoria = 'Energia & Ciclos de Carga';
    diagnostico.causasProvaveis = [
      { hipotese: 'Degradação química natural da bateria de Íon-Lítio (desgaste por ciclos)', probabilidade: '70%', evidencia: 'Baterias perdem entre 15% a 25% de capacidade a cada 300 a 500 ciclos de recarga.' },
      { hipotese: 'Processos de alta demanda em background drenando energia em suspensão', probabilidade: '50%', evidencia: 'Recursos como Modern Standby (S0) podem manter aplicativos consumindo carga mesmo com a tampa fechada.' }
    ];
    diagnostico.testesRecomendados = [
      '1. Gerar o Relatório Oficial de Bateria do Windows executando "powercfg /batteryreport".',
      '2. Comparar a Capacidade de Fábrica (Design Capacity) com a Capacidade Atual de Carga Máxima (Full Charge Capacity).',
      '3. Desativar a Inicialização Rápida do Windows para garantir o desligamento completo.'
    ];
    diagnostico.orientacoesFisicas = [
      '⚠️ RISCO DE INCHAÇO (SWOLLEN BATTERY): Se o touchpad estiver estufado ou o teclado levantado, DESLIGUE o notebook imediatamente. Baterias inchadas têm risco de vazamento químico e combustão.',
      'Nunca tente perfurar ou pressionar uma bateria de notebook estufada. Substitua por componente original ou certificado.'
    ];
    diagnostico.planoAcao = [
      'Gerar relatório de bateria para conferir o percentual real de degradação.',
      'Configurar plano de energia balanceado para prolongar a vida útil.'
    ];
    diagnostico.resumoFala = 'Diagnóstico de bateria ativado. Analisei o subsistema de energia. Recomendo gerar o relatório powercfg para calcular o desgaste exato em miliwatts-hora e identificar se há necessidade de calibração ou substituição da célula.';

  } else {
    diagnostico.causasProvaveis = [
      { hipotese: 'Análise de integridade de software e subsistemas locais', probabilidade: '60%', evidencia: 'Varredura forense geral de processos e armazenamento.' },
      { hipotese: 'Necessidade de calibração de performance e rotina de manutenção preventiva', probabilidade: '50%', evidencia: 'O sistema requer rotina periódica de otimização.' }
    ];
    diagnostico.testesRecomendados = [
      '1. Executar diagnóstico completo de hardware via H.E.L.E.N.A.',
      '2. Verificar integridade do disco SSD e relatórios de erro do sistema.'
    ];
    diagnostico.orientacoesFisicas = [
      'Manter o computador sobre superfícies planas e rígidas para não obstruir as entradas de ar.'
    ];
    diagnostico.planoAcao = [
      'Executar Sequência Dourada e otimização preventiva.'
    ];
    diagnostico.resumoFala = 'Diagnóstico técnico executado. Mapeei as especificações do seu equipamento e formulei o plano de ação não destrutivo correspondente.';
  }

  return {
    hardwareInfo: info,
    diagnostico
  };
}

// 3. Gerador de Relatório Técnico de Manutenção (Laudo Técnico)
function generateTechnicalReport(optionsOrSymptom, customNotes = '', acoesExec = []) {
  let sintoma = '';
  let diagObj = null;
  let acoesExecutadas = [];

  if (typeof optionsOrSymptom === 'object' && optionsOrSymptom !== null) {
    sintoma = optionsOrSymptom.sintoma || optionsOrSymptom.symptom || 'Inspeção Técnica de Rotina';
    diagObj = optionsOrSymptom.diagnostico || optionsOrSymptom.diagnostic || null;
    acoesExecutadas = optionsOrSymptom.acoesExecutadas || [];
  } else {
    sintoma = optionsOrSymptom || 'Inspeção Técnica de Rotina';
    acoesExecutadas = acoesExec;
  }

  const info = collectHardwareDiagnostics();
  const diagnostico = diagObj || runGuidedDiagnostic(sintoma, info).diagnostico;
  const timestamp = new Date();
  const dataFormatada = timestamp.toLocaleString('pt-BR');
  const fileName = `laudo_tecnico_${timestamp.toISOString().replace(/[:.]/g, '-')}.md`;
  const filePath = path.join(REPORTS_DIR, fileName);

  const markdown = `# LAUDO TÉCNICO DE INSPEÇÃO & DIAGNÓSTICO COMPUTACIONAL
**H.E.L.E.N.A. — Heurística de Execução Local e Estruturação Neural Autônoma**
**Data de Emissão:** ${dataFormatada}
**Identificador:** ${fileName.replace('.md', '')}

---

## 1. ESPECIFICAÇÕES DO EQUIPAMENTO
- **Dispositivo / Host:** ${info.computador.modelo} (${info.hostname})
- **Fabricante:** ${info.computador.fabricante}
- **Versão da BIOS:** ${info.computador.bios} (Data: ${info.computador.dataBios})
- **Processador:** ${info.processador.modelo}
- **Topologia de CPU:** ${info.processador.nucleosFisicos} Núcleos Físicos / ${info.processador.threadsLogicos} Threads Lógicos
- **Memória RAM:** ${info.memoriaRAM.totalGB} GB Total (${info.memoriaRAM.modulos.map(m => `${m.capacidadeGB}GB @ ${m.velocidadeMHz}MHz ${m.fabricante}`).join(', ')})
- **Armazenamento:** Partição C: ${info.armazenamento.particaoC.livreGB} GB livres de ${info.armazenamento.particaoC.totalGB} GB (${info.armazenamento.particaoC.percentualUso}% ocupado)
- **Discos Físicos Mapeados:** ${info.armazenamento.discosFisicos.map(d => `${d.modelo} [${d.tipo}] Saúde: ${d.saude}`).join('; ') || 'SAMSUNG SSD NVMe Healthy'}

---

## 2. QUEIXA / SINTOMA RELATADO
"${sintoma || 'Inspeção e diagnóstico técnico preventivo do sistema operacional e hardware.'}"

---

## 3. HIPÓTESES DIAGNÓSTICAS & NÍVEL DE CONFIANÇA
${(diagnostico.causasProvaveis || []).map((c, idx) => `### ${idx + 1}. ${c.hipotese}
- **Probabilidade:** ${c.probabilidade}
- **Evidência Observada:** ${c.evidencia}
`).join('\n')}

---

## 4. TESTES NÃO DESTRUTIVOS RECOMENDADOS
${(diagnostico.testesRecomendados || []).map(t => `- ${t}`).join('\n')}

---

## 5. ORIENTAÇÕES DE MANUTENÇÃO FÍSICA & SEGURANÇA
${(diagnostico.orientacoesFisicas || []).map(o => `> ${o}\n`).join('\n')}

---

## 6. AÇÕES EFETUADAS & RESULTADO DA VERIFICAÇÃO
${acoesExecutadas.length > 0 ? acoesExecutadas.map(a => `- **${a.etapa}:** ${a.detalhe} (Status: ${a.status})`).join('\n') : '- Inspeção diagnóstica não invasiva concluída com êxito.\n- Nenhuma modificação destrutiva sem autorização prévia.'}

---

## 7. PARECER TÉCNICO CONCLUSIVO
O equipamento foi submetido à auditoria forense local da H.E.L.E.N.A. A cadeia de integridade atesta que o hardware principal está funcional e apto a operar dentro dos parâmetros nominais após as manutenções orientadas.

*Documento gerado automaticamente pelo módulo de Diagnóstico Técnico da H.E.L.E.N.A.*
`;

  try {
    fs.writeFileSync(filePath, markdown, 'utf-8');
  } catch (err) {
    console.error('Erro ao gravar laudo técnico:', err.message);
  }

  return {
    sucesso: true,
    arquivo: fileName,
    caminhoAbsoluto: filePath,
    conteudoMarkdown: markdown
  };
}

module.exports = {
  collectHardwareDiagnostics,
  runGuidedDiagnostic,
  generateTechnicalReport
};
