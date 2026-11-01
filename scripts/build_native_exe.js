// =========================================================================
// H.E.L.E.N.A. — COMPILADOR DE EXECUTÁVEIS NATIVOS WINDOWS (.EXE) E ÍCONE (.ICO)
// Gera:
// 1. public/icons/helena.ico (Ícone oficial Windows)
// 2. HELENA_Desktop.exe (Aplicativo Desktop com System Tray em 2º plano)
// 3. HELENA_Setup.exe (Instalador Gráfico Oficial Windows .EXE)
// 4. Uninstall_HELENA.exe (Desinstalador Oficial Windows .EXE)
// =========================================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const ICONS_DIR = path.join(ROOT_DIR, 'public', 'icons');
const PNG_PATH = path.join(ICONS_DIR, 'icon-192.png');
const ICO_PATH = path.join(ICONS_DIR, 'helena.ico');
const CSC_PATH = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';

// 1. Gerar arquivo .ICO válido a partir do PNG oficial
function buildIcoFromPng() {
  if (!fs.existsSync(PNG_PATH)) {
    console.warn('[AVISO] icon-192.png não encontrado.');
    return false;
  }
  const pngBuf = fs.readFileSync(PNG_PATH);
  const header = Buffer.alloc(22);
  // ICONDIR header (6 bytes)
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(1, 4); // Count: 1 image

  // ICONDIRENTRY (16 bytes)
  header.writeUInt8(192, 6);  // Width
  header.writeUInt8(192, 7);  // Height
  header.writeUInt8(0, 8);    // Color count
  header.writeUInt8(0, 9);    // Reserved
  header.writeUInt16LE(1, 10); // Color planes
  header.writeUInt16LE(32, 12); // Bits per pixel
  header.writeUInt32LE(pngBuf.length, 14); // Size of image data
  header.writeUInt32LE(22, 18); // Offset of image data

  const icoBuf = Buffer.concat([header, pngBuf]);
  fs.writeFileSync(ICO_PATH, icoBuf);
  console.log('[OK] Ícone oficial gerado:', ICO_PATH);
  return true;
}

// 2. Código-fonte C# para HELENA_Desktop.exe (App Nativo + System Tray + Segundo Plano)
const desktopCsSource = `
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace HelenaDesktop
{
    public class TrayApplicationContext : ApplicationContext
    {
        private NotifyIcon trayIcon;
        private Process serverProcess;
        private string appDir;
        private MenuItem autoStartMenuItem;

        public TrayApplicationContext()
        {
            appDir = AppDomain.CurrentDomain.BaseDirectory;
            Icon customIcon = SystemIcons.Application;
            string icoPath = Path.Combine(appDir, "public", "icons", "helena.ico");
            if (File.Exists(icoPath))
            {
                try { customIcon = new Icon(icoPath); } catch { }
            }

            autoStartMenuItem = new MenuItem("Iniciar junto com o Windows", OnToggleAutoStart);
            autoStartMenuItem.Checked = IsAutoStartEnabled();

            ContextMenu menu = new ContextMenu(new MenuItem[] {
                new MenuItem("Abrir H.E.L.E.N.A. (Console Desktop)", OnOpenConsole) { DefaultItem = true },
                new MenuItem("Parear Celular (QR Code / PIN)", OnOpenMobilePairing),
                new MenuItem("-"),
                autoStartMenuItem,
                new MenuItem("Criar Atalhos na Area de Trabalho", OnCreateShortcuts),
                new MenuItem("Reiniciar Motor Local", OnRestartServer),
                new MenuItem("-"),
                new MenuItem("Encerrar H.E.L.E.N.A. Completamente", OnExit)
            });

            trayIcon = new NotifyIcon()
            {
                Icon = customIcon,
                ContextMenu = menu,
                Text = "H.E.L.E.N.A. — Copiloto Pessoal (Ativa em 2º Plano)",
                Visible = true
            };

            trayIcon.DoubleClick += OnOpenConsole;

            StartBackendServer();
            trayIcon.ShowBalloonTip(3000, "H.E.L.E.N.A. Ativa", "A H.E.L.E.N.A. está rodando em segundo plano. Clique duas vezes no ícone da bandeja para abrir.", ToolTipIcon.Info);

            // Abre a janela principal se não foi iniciada com --minimized
            string[] args = Environment.GetCommandLineArgs();
            bool startMinimized = false;
            foreach (string a in args)
            {
                if (a == "--minimized" || a == "--background") startMinimized = true;
            }

            if (!startMinimized)
            {
                LaunchAppWindow("http://localhost:3000?mode=app");
            }
        }

        private bool IsPortOpen(int port)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    var result = client.BeginConnect("127.0.0.1", port, null, null);
                    var success = result.AsyncWaitHandle.WaitOne(TimeSpan.FromMilliseconds(350));
                    if (!success) return false;
                    client.EndConnect(result);
                    return true;
                }
            }
            catch { return false; }
        }

        private string FindNodeExe()
        {
            string portableNode = Path.Combine(appDir, "runtime", "node", "node.exe");
            if (File.Exists(portableNode)) return portableNode;

            string pfNode = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs", "node.exe");
            if (File.Exists(pfNode)) return pfNode;

            return "node.exe";
        }

        private void StartBackendServer()
        {
            if (IsPortOpen(3000)) return;

            try
            {
                string nodeExe = FindNodeExe();
                string serverJs = Path.Combine(appDir, "server.js");
                ProcessStartInfo psi = new ProcessStartInfo()
                {
                    FileName = nodeExe,
                    Arguments = "\\"" + serverJs + "\\"",
                    WorkingDirectory = appDir,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                serverProcess = Process.Start(psi);

                // Aguarda até 4s pelo servidor
                for (int i = 0; i < 12; i++)
                {
                    if (IsPortOpen(3000)) break;
                    Thread.Sleep(300);
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erro ao iniciar o motor da H.E.L.E.N.A.: " + ex.Message, "H.E.L.E.N.A.", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void LaunchAppWindow(string url)
        {
            string[] browserPaths = new string[] {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft", "Edge", "Application", "msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Google", "Chrome", "Application", "chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Google", "Chrome", "Application", "chrome.exe")
            };

            foreach (string browser in browserPaths)
            {
                if (File.Exists(browser))
                {
                    Process.Start(new ProcessStartInfo()
                    {
                        FileName = browser,
                        Arguments = "--app=" + url + " --window-size=1360,860",
                        UseShellExecute = true
                    });
                    return;
                }
            }

            Process.Start(new ProcessStartInfo() { FileName = url, UseShellExecute = true });
        }

        private void OnOpenConsole(object sender, EventArgs e)
        {
            StartBackendServer();
            LaunchAppWindow("http://localhost:3000?mode=app");
        }

        private void OnOpenMobilePairing(object sender, EventArgs e)
        {
            StartBackendServer();
            LaunchAppWindow("http://localhost:3000?mode=app&pair=1");
        }

        private bool IsAutoStartEnabled()
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(@"Software\\Microsoft\\Windows\\CurrentVersion\\Run", false))
                {
                    return key != null && key.GetValue("HELENA_Copilot_Desktop") != null;
                }
            }
            catch { return false; }
        }

        private void OnToggleAutoStart(object sender, EventArgs e)
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(@"Software\\Microsoft\\Windows\\CurrentVersion\\Run", true))
                {
                    if (IsAutoStartEnabled())
                    {
                        key.DeleteValue("HELENA_Copilot_Desktop", false);
                        autoStartMenuItem.Checked = false;
                        trayIcon.ShowBalloonTip(2000, "H.E.L.E.N.A.", "Inicialização com o Windows desativada.", ToolTipIcon.Info);
                    }
                    else
                    {
                        string exePath = Application.ExecutablePath;
                        key.SetValue("HELENA_Copilot_Desktop", "\\"" + exePath + "\\" --minimized");
                        autoStartMenuItem.Checked = true;
                        trayIcon.ShowBalloonTip(2000, "H.E.L.E.N.A.", "A H.E.L.E.N.A. iniciará automaticamente com o Windows.", ToolTipIcon.Info);
                    }
                }
            }
            catch { }
        }

        private void OnCreateShortcuts(object sender, EventArgs e)
        {
            try
            {
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                CreateShortcut(Path.Combine(desktop, "H.E.L.E.N.A. Copilot.lnk"), Application.ExecutablePath, appDir);
                trayIcon.ShowBalloonTip(2000, "Atalhos Criados", "Atalho da H.E.L.E.N.A. adicionado na Área de Trabalho!", ToolTipIcon.Info);
            }
            catch { }
        }

        public static void CreateShortcut(string lnkPath, string targetExe, string workDir)
        {
            string ico = Path.Combine(workDir, "public", "icons", "helena.ico");
            string ps = "$s=(New-Object -COM WScript.Shell).CreateShortcut('" + lnkPath + "');" +
                        "$s.TargetPath='" + targetExe + "';" +
                        "$s.WorkingDirectory='" + workDir + "';" +
                        "if(Test-Path '" + ico + "'){$s.IconLocation='" + ico + "'};" +
                        "$s.Save()";
            Process.Start(new ProcessStartInfo()
            {
                FileName = "powershell.exe",
                Arguments = "-NoProfile -ExecutionPolicy Bypass -Command \\"" + ps + "\\"",
                CreateNoWindow = true,
                UseShellExecute = false
            }).WaitForExit(3000);
        }

        private void OnRestartServer(object sender, EventArgs e)
        {
            try
            {
                if (serverProcess != null && !serverProcess.HasExited) serverProcess.Kill();
            }
            catch { }
            StartBackendServer();
            trayIcon.ShowBalloonTip(2000, "H.E.L.E.N.A.", "Motor local reiniciado com sucesso.", ToolTipIcon.Info);
        }

        private void OnExit(object sender, EventArgs e)
        {
            trayIcon.Visible = false;
            try
            {
                if (serverProcess != null && !serverProcess.HasExited) serverProcess.Kill();
            }
            catch { }
            Application.Exit();
        }
    }

    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new TrayApplicationContext());
        }
    }
}
`;

// 3. Código-fonte C# para HELENA_Setup.exe (Instalador Gráfico Windows)
const setupCsSource = `
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using Microsoft.Win32;

namespace HelenaInstaller
{
    public class SetupForm : Form
    {
        private CheckBox chkDesktop;
        private CheckBox chkStartMenu;
        private CheckBox chkAutoStart;
        private Button btnInstall;
        private Label lblStatus;
        private string appDir;

        public SetupForm()
        {
            appDir = AppDomain.CurrentDomain.BaseDirectory;
            this.Text = "Instalador Oficial — H.E.L.E.N.A. Copilot v2.5";
            this.Size = new Size(520, 390);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(8, 15, 30);
            this.ForeColor = Color.White;

            string icoPath = Path.Combine(appDir, "public", "icons", "helena.ico");
            if (File.Exists(icoPath))
            {
                try { this.Icon = new Icon(icoPath); } catch { }
            }

            Label lblTitle = new Label()
            {
                Text = "H.E.L.E.N.A. — COPILOTO PESSOAL WINDOWS",
                Font = new Font("Consolas", 13, FontStyle.Bold),
                ForeColor = Color.FromArgb(0, 240, 255),
                Location = new Point(25, 22),
                AutoSize = true
            };

            Label lblSub = new Label()
            {
                Text = "Configuração do aplicativo nativo, atalhos do sistema e execução em 2º plano.",
                Font = new Font("Segoe UI", 9, FontStyle.Regular),
                ForeColor = Color.LightGray,
                Location = new Point(25, 50),
                Size = new Size(460, 36)
            };

            chkDesktop = new CheckBox()
            {
                Text = "Criar atalho na Área de Trabalho (Desktop)",
                Checked = true,
                Font = new Font("Segoe UI", 10),
                Location = new Point(30, 100),
                Size = new Size(440, 28)
            };

            chkStartMenu = new CheckBox()
            {
                Text = "Adicionar atalho no Menu Iniciar do Windows",
                Checked = true,
                Font = new Font("Segoe UI", 10),
                Location = new Point(30, 135),
                Size = new Size(440, 28)
            };

            chkAutoStart = new CheckBox()
            {
                Text = "Iniciar H.E.L.E.N.A. automaticamente com o Windows (Bandeja)",
                Checked = false,
                Font = new Font("Segoe UI", 10),
                Location = new Point(30, 170),
                Size = new Size(450, 28)
            };

            lblStatus = new Label()
            {
                Text = "Diretório: " + appDir,
                Font = new Font("Consolas", 8),
                ForeColor = Color.Cyan,
                Location = new Point(30, 215),
                Size = new Size(450, 35)
            };

            btnInstall = new Button()
            {
                Text = "INSTALAR E INICIAR H.E.L.E.N.A. AGORA",
                Font = new Font("Consolas", 11, FontStyle.Bold),
                BackColor = Color.FromArgb(0, 210, 240),
                ForeColor = Color.Black,
                FlatStyle = FlatStyle.Flat,
                Location = new Point(30, 265),
                Size = new Size(445, 50),
                Cursor = Cursors.Hand
            };
            btnInstall.Click += OnInstallClick;

            this.Controls.Add(lblTitle);
            this.Controls.Add(lblSub);
            this.Controls.Add(chkDesktop);
            this.Controls.Add(chkStartMenu);
            this.Controls.Add(chkAutoStart);
            this.Controls.Add(lblStatus);
            this.Controls.Add(btnInstall);
        }

        private void CreateShortcut(string lnkPath, string targetExe, string workDir)
        {
            string ico = Path.Combine(workDir, "public", "icons", "helena.ico");
            string ps = "$s=(New-Object -COM WScript.Shell).CreateShortcut('" + lnkPath + "');" +
                        "$s.TargetPath='" + targetExe + "';" +
                        "$s.WorkingDirectory='" + workDir + "';" +
                        "if(Test-Path '" + ico + "'){$s.IconLocation='" + ico + "'};" +
                        "$s.Save()";
            Process.Start(new ProcessStartInfo()
            {
                FileName = "powershell.exe",
                Arguments = "-NoProfile -ExecutionPolicy Bypass -Command \\"" + ps + "\\"",
                CreateNoWindow = true,
                UseShellExecute = false
            }).WaitForExit(3500);
        }

        private void OnInstallClick(object sender, EventArgs e)
        {
            btnInstall.Enabled = false;
            lblStatus.Text = "Configurando integração com o Windows...";
            Application.DoEvents();

            string desktopExe = Path.Combine(appDir, "HELENA_Desktop.exe");
            if (!File.Exists(desktopExe))
            {
                desktopExe = Path.Combine(appDir, "Iniciar_HELENA.bat");
            }

            if (chkDesktop.Checked)
            {
                string deskDir = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                CreateShortcut(Path.Combine(deskDir, "H.E.L.E.N.A. Copilot.lnk"), desktopExe, appDir);
            }

            if (chkStartMenu.Checked)
            {
                string startDir = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
                CreateShortcut(Path.Combine(startDir, "H.E.L.E.N.A. Copilot.lnk"), desktopExe, appDir);
            }

            try
            {
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(@"Software\\Microsoft\\Windows\\CurrentVersion\\Run", true))
                {
                    if (chkAutoStart.Checked)
                        key.SetValue("HELENA_Copilot_Desktop", "\\"" + desktopExe + "\\" --minimized");
                    else
                        key.DeleteValue("HELENA_Copilot_Desktop", false);
                }
            }
            catch { }

            lblStatus.Text = "Instalação concluída! Iniciando H.E.L.E.N.A. Desktop...";
            Application.DoEvents();

            try
            {
                Process.Start(new ProcessStartInfo()
                {
                    FileName = desktopExe,
                    WorkingDirectory = appDir,
                    UseShellExecute = true
                });
            }
            catch { }

            this.Close();
        }

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new SetupForm());
        }
    }
}
`;

// 4. Código-fonte C# para Uninstall_HELENA.exe (Desinstalador Oficial)
const uninstallCsSource = `
using System;
using System.IO;
using System.Windows.Forms;
using Microsoft.Win32;

namespace HelenaUninstaller
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            var res = MessageBox.Show(
                "Deseja remover os atalhos e a inicialização automática da H.E.L.E.N.A. do Windows?\\n\\n(Seus arquivos de memória e configurações locais serão preservados na pasta para sua segurança).",
                "Desinstalador H.E.L.E.N.A.",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question
            );

            if (res != DialogResult.Yes) return;

            try
            {
                string desk = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "H.E.L.E.N.A. Copilot.lnk");
                if (File.Exists(desk)) File.Delete(desk);

                string start = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "H.E.L.E.N.A. Copilot.lnk");
                if (File.Exists(start)) File.Delete(start);

                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(@"Software\\Microsoft\\Windows\\CurrentVersion\\Run", true))
                {
                    if (key != null) key.DeleteValue("HELENA_Copilot_Desktop", false);
                }

                MessageBox.Show("Atalhos e registros de inicialização da H.E.L.E.N.A. foram removidos com sucesso!", "Desinstalação Concluída", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erro durante a desinstalação: " + ex.Message, "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
`;

function compileExe(csCode, outputExeName) {
  const tempCs = path.join(ROOT_DIR, `temp_${outputExeName}.cs`);
  const outExe = path.join(ROOT_DIR, outputExeName);
  fs.writeFileSync(tempCs, csCode, 'utf-8');

  const iconArg = fs.existsSync(ICO_PATH) ? `/win32icon:"${ICO_PATH}"` : '';
  const cmd = `"${CSC_PATH}" /nologo /target:winexe /out:"${outExe}" ${iconArg} /r:System.Windows.Forms.dll /r:System.Drawing.dll "${tempCs}"`;

  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`[OK] Executável compilado com sucesso: ${outExe}`);
  } finally {
    if (fs.existsSync(tempCs)) fs.unlinkSync(tempCs);
  }
}

console.log('=======================================================');
console.log('  COMPILANDO EXECUTÁVEIS NATIVOS WINDOWS (.EXE)');
console.log('=======================================================');
buildIcoFromPng();
compileExe(desktopCsSource, 'HELENA_Desktop.exe');
compileExe(setupCsSource, 'HELENA_Setup.exe');
compileExe(uninstallCsSource, 'Uninstall_HELENA.exe');
console.log('=======================================================');
