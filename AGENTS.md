# AGENTS.md — Universal Guidelines for AI Agents

Welcome, AI Agent. This document establishes the universal rules, architectural invariants, and verification workflows for **H.E.L.E.N.A.** (Heurística de Execução Local e Estruturação Neural Autônoma).

---

## 📍 Single Source of Truth (Obsidian Vault Documentation)

The complete mega-context ecosystem and canonical documentation for this project is stored in the operator's central Obsidian vault at:
```
C:\Users\user\Documents\Obsidian\cryoProjects\01 - Projetos\HelenaHUD\
```

Refer to the 7 master documents before performing complex architectural tasks:
1. `00 - MEGA_CONTEXTO.md`: Executive master prompt, condensed stack, and module matrix.
2. `01 - Visao_e_Objetivos.md`: Product vision, target persona, and local-first philosophy.
3. `02 - Stack_e_Comandos.md`: Complete tech stack, environment variables, and build lifecycle.
4. `03 - Arquitetura_e_Pastas.md`: Directory tree, ASCII data flows, and architectural decisions.
5. `04 - Banco_e_Modelos.md`: JSON database schemas, transactional persistence, and TypeScript DTOs.
6. `05 - Regras_de_Negocio.md`: Critical security invariants, sandboxing, and HITL policies.
7. `06 - Roadmap_e_Decisoes.md`: Architecture Decision Records (ADRs) and evolution phases.

---

## 🛡️ Non-Negotiable Invariants ("Golden Rules")

1. **Absolute Hardware Truthfulness (Anti-Mocking):**
   - Never provide hardcoded, mocked, or fabricated hardware telemetry (e.g. static Xeon CPUs, fixed 4 cores).
   - Real hardware must always be queried via `modules/windows_tools.js` using WMI/CIM and `tasklist`.
2. **Zero Trust Local Network Security:**
   - LAN devices (`192.168.x.x`, `10.x.x.x`) are untrusted by default.
   - Any external connection must supply a valid `x-helena-device-token` created through temporary 6-digit PIN / QR Code challenge. Unauthenticated calls must receive HTTP 403.
3. **Human-in-the-Loop (HITL) for Remote Mobile Actions:**
   - Destructive, maintenance, or OS control actions requested by mobile devices must enter the `pendingApprovals` queue and require physical confirmation on the host PC before execution.
4. **Strict File System Sandboxing:**
   - File manipulation tools (`searchLocalFiles`, `createUserDocument`, `renameUserFile`) must remain confined to user profile directories: `Desktop`, `Documents`, `Downloads`, and the HELENA workspace. Never touch `C:\Windows` or system directories.
5. **Root and `client/` Synchronization:**
   - Maintain structural parity between backend modules in the root and in the `client/` directory to ensure portable zip generation (`scripts/build_portable_zip.js`) succeeds on offline client systems.
6. **Multi-Agent Privacy Scopes & Validated Tool Execution:**
   - Specialized agents (`academic`, `archivist`, `builder`, `reviewer`) only receive scoped memory via `memoryStore.getAgentScopedContext(agentId)` and can only execute OS tools listed in their `allowedAgents` schema (`windowsTools.executeValidatedTool`).
7. **Permanent Wake Word ("HELENA") & Dual Desktop Modes:**
   - `HELENA_Desktop.exe` supports **Modo 1 (`--background`)** (silent System Tray + continuous Wake Word listening) and **Modo 2 (HUD + 3D Office)**.

---

## 🛠️ Verification & Build Commands

Always run these commands from the project root using PowerShell:

```powershell
# 1. Full Real Automated Test Suite (12 E2E suites against real Windows OS)
node scripts/validate_helena_full.js

# 2. Frontend Build & Static Asset Generation
npm.cmd run build

# 3. Native Windows Executable Compilation (.NET C# CSC)
node scripts/build_native_exe.js

# 4. Portable Zip Distribution Builder (for USB / Pen Drives)
node scripts/build_portable_zip.js
```
