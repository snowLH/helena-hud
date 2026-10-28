Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetParentFolderName(WScript.ScriptFullName)

' 1. Verificar se o servidor local na porta 3000 já está ativo
isServerRunning = False
On Error Resume Next
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.Open "GET", "http://127.0.0.1:3000/api/system/status", False
http.setTimeouts 800, 800, 800, 800
http.Send

If Err.Number = 0 And http.Status = 200 Then
    isServerRunning = True
End If
On Error GoTo 0

' 2. Iniciar servidor Node.js silenciosamente em segundo plano caso não esteja rodando
If Not isServerRunning Then
    WshShell.Run "cmd /c cd /d """ & strPath & """ && node server.js", 0, False
    WScript.Sleep 1500
End If

' 3. Abrir a Interface HUD em Modo Janela Nativa de Aplicativo (Edge ou Chrome)
edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
If Not fso.FileExists(edgePath) Then
    edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
End If

If fso.FileExists(edgePath) Then
    WshShell.Run """" & edgePath & """ --app=http://127.0.0.1:3000 --window-name=""HELENA"" --start-fullscreen", 1, False
Else
    chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
    If fso.FileExists(chromePath) Then
        WshShell.Run """" & chromePath & """ --app=http://127.0.0.1:3000 --window-name=""HELENA"" --start-fullscreen", 1, False
    Else
        WshShell.Run "http://127.0.0.1:3000", 1, False
    End If
End If
