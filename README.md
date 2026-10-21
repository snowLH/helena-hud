# H.E.L.E.N.A. — Heurística de Execução Local e Estruturação Neural Autônoma
> **HUD Futurista 100% Local, Offline e Portátil para Windows (Zero-API)**

H.E.L.E.N.A. é uma aplicação Full-Stack desenvolvida para rodar diretamente a partir de um **pen drive** ou de qualquer pasta local no Windows sem necessidade de chaves de API externas, sem dependência de nuvem e sem custos.

---

## ⚡ Principais Capacidades

1. **Zero APIs Externas (100% On-Premise e Privativo)**:
   - Proibição de APIs pagas: Não requer OpenAI, Google Gemini ou ElevenLabs.
   - **Motor Híbrido Local (`/api/helena/brain`)**:
     - **Motor Especialista Nativo**: Gera instantaneamente os textos de fala e cartões da H.E.L.E.N.A. a partir de regras dinâmicas e telemetria real do Windows.
     - **Conector LLM Local Opcional**: Conecta-se automaticamente a `http://127.0.0.1:8080/v1/chat/completions` (padrão `llama-server.exe` / `Ollama`) se houver um modelo `.gguf` rodando localmente no pen drive, com fallback automático imediato para o motor nativo.
   - **Voz e Efeitos Sonoros Offline**:
     - Síntese de voz feminina em Português do Brasil (`pt-BR`) via `window.speechSynthesis`.
     - Rota backend `/api/tts` preparada para executar binário portátil `runtime/piper.exe`.
     - Sintetizador procedural de efeitos sonoros sci-fi via **Web Audio API** (bipes de telemetria, laser de varredura biométrica, confirmação de identidade e pulsos de transição energética).
     - Reconhecimento de voz offline via `SpeechRecognition` (`webkitSpeechRecognition`).

2. **Telemetria e Otimização Real do Windows**:
   - `GET /api/system/status`: CPU real (% de uso, modelo, núcleos), RAM real (usada, livre, total), espaço em disco C: (usado/livre), latência de rede (ping ms), arquivos acumulados em `%TEMP%`, e os 5 processos mais pesados no momento.
   - `POST /api/system/optimize`: Bateria de otimização segura que apaga arquivos temporários órfãos em `os.tmpdir()`, libera memória virtual, renova cache DNS (`ipconfig /flushdns`) e ativa o plano de **Alto Desempenho** do Windows.
   - `GET /api/briefing/data` e `POST /api/briefing/data`: Integração e edição do arquivo `dados_pessoais.json` no pen drive (Agenda, Prioridades, Metas e Clima).

3. **Interface Visual Sci-Fi HUD em Tela Cheia**:
   - Fundo roxo-escuro profundo (`#0b0410`) com grade técnica translúcida e brilho radial no centro.
   - Cabeçalho com indicadores em pill (`RECONHECIDO`, `CONSOLIDADO`, `BRIEFING ON`) e estado principal (`FALANDO` / `EM ESPERA`).
   - Orbe Central 3D em `<canvas>` com anéis concêntricos giroscópicos, nuvem de partículas orbitais e retículo de mira. A velocidade e vibração aumentam quando a H.E.L.E.N.A. está falando.
   - Biometria facial via webcam real (`getUserMedia`) com retículo de escaneamento holográfico.
   - Painéis laterais com glassmorphism exibindo CPU, RAM, osciloscópio de voz e armazenamento.
   - Máquina de estados interativa: os cartões são narrados no centro do orbe e deslizam suavemente via **Framer Motion** para a Dock inferior horizontal.

---

## 🚀 Como Iniciar com 1 Clique (Pen Drive)

Basta dar dois cliques no arquivo:
```cmd
Iniciar_HELENA.bat
```
O script cuidará de tudo:
1. Verifica o Node.js.
2. Inicializa o servidor backend local na porta 3000.
3. Abre automaticamente o Google Chrome ou Microsoft Edge no modo de aplicativo em tela cheia (`--app=http://localhost:3000 --start-fullscreen`).

---

## 🎙️ Comandos de Voz Reconhecidos

Diga ao microfone ou utilize os botões de ação rápida na tela:
- **"Helena, bom dia"**: Dispara o Briefing Matinal completo (Biometria Facial ➔ Sincronização e Consolidação de Heurísticas ➔ Cartão de Hardware & Rede ➔ Cartão de Agenda ➔ Cartão de Prioridades ➔ Finalização).
- **"Helena, otimizar computador"** (ou "otimizar o PC"): Dispara a limpeza real do computador, purga do `%TEMP%`, liberação de DNS e ativação de alto desempenho.
- **"Helena, limpar memória"**: Diagnostica o consumo de RAM e lista processos pesados.
- **"Helena, relatório de sistema"**: Exibe o diagnóstico completo da máquina.

---

## 📁 Estrutura de Arquivos

```
helena-hud-local/
├── Iniciar_HELENA.bat      # Script portátil para pen drive (1-clique)
├── server.js              # Servidor Express de telemetria e otimização
├── dados_pessoais.json    # Base local editável de agenda, metas e preferências
├── package.json           # Dependências do backend
├── runtime/               # Pasta para extensões portáteis opcionais (piper.exe / .gguf)
└── client/                # Interface React + Vite + TypeScript + Tailwind CSS
    ├── src/
    │   ├── audio/
    │   │   ├── synth.ts   # Sintetizador procedural Web Audio API (sci-fi FX)
    │   │   └── speech.ts  # Controlador TTS offline pt-BR
    │   ├── components/
    │   │   ├── EnergyOrb.tsx            # Orbe 3D e scanner biométrico
    │   │   ├── AudioVisualizer.tsx      # Osciloscópio de modulação de voz
    │   │   ├── Header.tsx               # Top bar com pills e estado
    │   │   ├── LeftPanel.tsx            # Widgets de CPU e RAM
    │   │   ├── RightPanel.tsx           # Widgets de Rede, Disco e Clima
    │   │   ├── CardFocus.tsx            # Cartão de foco central
    │   │   ├── ConsolidationOverlay.tsx # Sincronização de módulos
    │   │   ├── BottomDock.tsx           # Dock horizontal de cartões
    │   │   ├── CommandBar.tsx           # Barra de comandos e microfone
    │   │   └── SettingsModal.tsx        # Editor de dados pessoais
    │   ├── App.tsx
    │   └── index.css
    └── dist/              # Build estático pronto para produção
```
