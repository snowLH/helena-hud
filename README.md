# H.E.L.E.N.A. — Heurística de Execução Local e Estruturação Neural Autônoma
> **HUD Futurista J.A.R.V.I.S. (100% Local, PWA Instalável e Pronta para Vercel)**

H.E.L.E.N.A. é uma aplicação Full-Stack desenvolvida tanto para rodar de forma **100% local e portátil no Windows a partir de um pen drive**, quanto como um **PWA (Progressive Web App) instalável** no celular/desktop e pronta para ser publicada na nuvem com **deploy contínuo no Vercel via GitHub**.

---

## ⚡ Principais Capacidades

1. **Voz Neural J.A.R.V.I.S. Feminina (F.R.I.D.A.Y.) com Efeito Holográfico**:
   - Adeus às vozes mecânicas do Windows: agora utiliza modelos neurais de estúdio (Edge TTS / Python) transmitidos via streaming em alta definição.
   - **Voz J.A.R.V.I.S. Feminina (Francisca Neural)**: Tom aveludado (`-2Hz`) e cadência sofisticada (`+2%`).
   - **Cadeia Acústica Holográfica (Web Audio DSP)**: Ressonância de sala holográfica (18ms comb filter), realce de presença em 3.4kHz e compressão broadcast idêntica aos filmes do Homem de Ferro.
   - Cache em tempo real para respostas de voz instantâneas (100ms).

2. **PWA Instalável (Progressive Web App)**:
   - Baixável diretamente pelo navegador em computadores (Windows/macOS), celulares (Android/iOS) e tablets.
   - Ícones dedicados em alta resolução, tela cheia nativa sem barras de navegador (`display: standalone`) e Service Worker com suporte offline.
   - Botão **`[ BAIXAR APP (PWA) ]`** integrado ao cabeçalho do HUD.

3. **Deploy Automatizado no Vercel**:
   - Configurada com `vercel.json` e `api/index.js` (Serverless Function).
   - O frontend React é compilado na CDN de alta velocidade do Vercel e a API é executada sem necessidade de servidor dedicado.

4. **Telemetria e Otimização do Windows**:
   - `GET /api/system/status`: CPU, RAM, Disco C:, latência ping e top processos.
   - `POST /api/system/optimize`: Limpeza de `%TEMP%`, liberação de DNS (`ipconfig /flushdns`) e ativação do plano de Alto Desempenho.

---

## 🚀 Sincronização com GitHub (Configurado para `snowLH`)

O repositório já está sincronizado com a sua conta GitHub:
- **Repositório**: [https://github.com/snowLH/helena-hud](https://github.com/snowLH/helena-hud)
- **Branch**: `main`

Qualquer nova alteração pode ser enviada com:
```bash
git add .
git commit -m "atualização do hud"
git push
```

---

## ☁️ Publicação no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
2. Clique em **"Add New..." ➔ "Project"**.
3. Selecione o repositório **`snowLH/helena-hud`**.
4. O Vercel detectará o projeto automaticamente:
   - **Framework Preset**: *Vite*
   - **Root Directory**: `./` (padrão)
   - **Build Command**: `vite build`
   - **Output Directory**: `dist`
5. Clique em **"Deploy"** (ou se já criou o projeto, acione **"Redeploy"** no painel do Vercel).
6. Em menos de 1 minuto, a H.E.L.E.N.A. estará online com HTTPS gratuito e deploy contínuo automático a cada `git push`!

---

## 📲 Como Instalar como PWA (No Celular ou PC)

- **No Computador (Chrome/Edge)**:
  - Abra o site e clique no botão **`[ BAIXAR APP (PWA) ]`** no topo, ou clique no ícone de instalar na barra de endereços do navegador (ao lado da estrela de favoritos).
  - A H.E.L.E.N.A. se tornará uma janela autônoma de aplicativo sem bordas de navegador.
- **No Celular (Android / iOS)**:
  - Acesse o link pelo Chrome ou Safari.
  - No menu de opções (três pontos ou botão Compartilhar), selecione **"Adicionar à tela de início"** ou **"Instalar Aplicativo"**.
  - O ícone holográfico da H.E.L.E.N.A. será adicionado à grade de aplicativos do seu celular.

---

## 💾 Execução Local Portátil (Pen Drive)

Para rodar offline diretamente no seu computador sem passar pela internet:
```powershell
.\Iniciar_HELENA.bat
```
*(ou clique duas vezes no atalho da Área de Trabalho `Iniciar_HELENA.bat`)*
