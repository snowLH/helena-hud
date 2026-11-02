# Diretrizes Obrigatórias para Agentes Gemini & Antigravity

> **FONTE DA VERDADE DO PROJETO:**  
> A documentação oficial e o Mega Contexto arquitetural deste projeto estão centralizados no cofre Obsidian em:  
> `C:\Users\user\Documents\Obsidian\cryoProjects\01 - Projetos\HelenaHUD\`
> 
> Antes de propor ou realizar modificações estruturais profundas, consulte sempre os 7 documentos canônicos:
> - `00 - MEGA_CONTEXTO.md` (O Master Prompt e visão condensada)
> - `01 - Visao_e_Objetivos.md` (Propósito, persona e modelo de negócio)
> - `02 - Stack_e_Comandos.md` (Comandos de execução, variáveis e build)
> - `03 - Arquitetura_e_Pastas.md` (Árvore de diretórios e diagramas de fluxo)
> - `04 - Banco_e_Modelos.md` (Modelagem JSON e schemas transacionais)
> - `05 - Regras_de_Negocio.md` (Invariantes de segurança e HITL)
> - `06 - Roadmap_e_Decisoes.md` (ADRs e roadmap técnico)

---

## 🛡️ Regras Invioláveis de Desenvolvimento

1. **Anti-Mocking (Zero Telemetria Falsa):**
   - Nunca retorne dados fictícios para CPU, RAM, GPU ou Bateria se a rota puder consultar o hardware real.
   - Sempre utilize `modules/windows_tools.js` e `technical_diagnostics.js`.
2. **Segurança de Rede Local (Zero Trust LAN):**
   - Requisições vindas de IPs externos ao `localhost` (ex.: `192.168.x.x`) exigem obrigatoriamente autenticação via `x-helena-device-token`.
   - Bloqueio com HTTP 403 Forbidden para qualquer tentativa sem token válido.
3. **Barreira Human-in-the-Loop (HITL):**
   - Ações que alterem o estado do computador (otimização, fechamento de processos, reparos) comandadas pelo celular devem ser retidas na fila `pendingApprovals` até a confirmação física no computador.
4. **Isolamento de Arquivos Locais:**
   - Apenas os diretórios `Desktop`, `Documents`, `Downloads` e a pasta da HELENA são permitidos para operações de leitura, escrita e renomeação via `windowsTools`.
5. **Paridade com a Pasta `client/`:**
   - Sempre mantenha os módulos e arquivos do backend sincronizados entre a raiz e a pasta `client/` para garantir a integridade dos pacotes portáteis.
6. **Comandos PowerShell no Windows:**
   - Use sempre `npm.cmd` em vez de `npm`.
   - Após qualquer alteração significativa, valide a suíte real com:
     ```powershell
     node scripts/validate_helena_full.js
     ```
