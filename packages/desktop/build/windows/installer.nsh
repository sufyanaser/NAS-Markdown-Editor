; NAS Markdown Editor — Windows file registration.
;
; The app registers itself under the "Open with" list of every Markdown
; extension and never claims the extension's default handler. electron-builder
; writes `Software\Classes\.md` (default value = its own ProgId) from
; `fileAssociations`; that default is removed again here so Windows keeps the
; user's current default app. The "Open with" dialog builds its entries from
; OpenWithProgids, which is the only key this installer adds per extension.
;
; The ProgID name must stay stable across versions: Windows pins a user's
; "Open with" choice to it, and renaming it would orphan that choice.
!define MT_PROGID "NASMarkdownEditor.Document"
!define MT_CMD_OPEN '"$INSTDIR\nas-markdown-editor.exe" "%1"'

!macro mtOpenWithExtension EXT
  WriteRegNone SHELL_CONTEXT "Software\Classes\${EXT}\OpenWithProgids" "${MT_PROGID}"
!macroend

; Drops only the default-handler value this app or electron-builder wrote.
; Any other default (a user's own editor) is left untouched.
!macro mtReleaseDefaultExtension EXT
  Push $0
  ReadRegStr $0 SHELL_CONTEXT "Software\Classes\${EXT}" ""
  ${if} $0 == "Markdown"
  ${orif} $0 == "${MT_PROGID}"
    DeleteRegValue SHELL_CONTEXT "Software\Classes\${EXT}" ""
  ${endIf}
  Pop $0
!macroend

!macro mtUnregisterExtension EXT
  DeleteRegValue SHELL_CONTEXT "Software\Classes\${EXT}\OpenWithProgids" "${MT_PROGID}"
  Push $0
  ReadRegStr $0 SHELL_CONTEXT "Software\Classes\${EXT}" ""
  ${if} $0 == "${MT_PROGID}"
    DeleteRegValue SHELL_CONTEXT "Software\Classes\${EXT}" ""
  ${endIf}
  Pop $0
!macroend

!macro customInstall
  !insertmacro mtReleaseDefaultExtension ".md"
  !insertmacro mtReleaseDefaultExtension ".markdown"
  !insertmacro mtReleaseDefaultExtension ".mmd"
  !insertmacro mtReleaseDefaultExtension ".mdown"
  !insertmacro mtReleaseDefaultExtension ".mdtxt"
  !insertmacro mtReleaseDefaultExtension ".mdtext"
  !insertmacro mtReleaseDefaultExtension ".mdx"

  !insertmacro mtOpenWithExtension ".md"
  !insertmacro mtOpenWithExtension ".markdown"
  !insertmacro mtOpenWithExtension ".mmd"
  !insertmacro mtOpenWithExtension ".mdown"
  !insertmacro mtOpenWithExtension ".mdtxt"
  !insertmacro mtOpenWithExtension ".mdtext"
  !insertmacro mtOpenWithExtension ".mdx"

  WriteRegStr SHELL_CONTEXT "Software\Classes\${MT_PROGID}" "" "NAS Markdown Document"
  WriteRegExpandStr SHELL_CONTEXT "Software\Classes\${MT_PROGID}\DefaultIcon" \
    "" "$INSTDIR\resources\icons\md.ico,0"
  WriteRegExpandStr SHELL_CONTEXT "Software\Classes\${MT_PROGID}\shell\open\command" \
    "" "${MT_CMD_OPEN}"

  ; electron-builder's own ProgId (`Markdown`) carries an unquoted command path,
  ; which breaks when the install directory contains a space. Quote it.
  WriteRegExpandStr SHELL_CONTEXT "Software\Classes\Markdown\shell\open\command" \
    "" "${MT_CMD_OPEN}"

  ; Explorer caches file type handlers until sign-in otherwise.
  System::Call 'shell32::SHChangeNotify(i, i, i, i) v (0x08000000, 0, 0, 0)'
!macroend

!macro customUnInstall
  ; An update passes through the old uninstaller right before the new version
  ; re-registers, so registrations are removed only on a real uninstall.
  ${ifNot} ${isUpdated}
    !insertmacro mtUnregisterExtension ".md"
    !insertmacro mtUnregisterExtension ".markdown"
    !insertmacro mtUnregisterExtension ".mmd"
    !insertmacro mtUnregisterExtension ".mdown"
    !insertmacro mtUnregisterExtension ".mdtxt"
    !insertmacro mtUnregisterExtension ".mdtext"
    !insertmacro mtUnregisterExtension ".mdx"
    DeleteRegKey SHELL_CONTEXT "Software\Classes\${MT_PROGID}"
  ${endIf}

  MessageBox MB_YESNO "Do you want to delete user settings?" /SD IDNO IDNO SkipRemoval
    SetShellVarContext current
    RMDir /r "$APPDATA\marktext"
  SkipRemoval:
!macroend
