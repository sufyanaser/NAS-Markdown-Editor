# NOTICE

NAS Markdown Editor is a derivative work of MarkText v0.23.0.

## Upstream

MarkText — https://github.com/marktext/marktext — MIT License.

Copyright (c) 2017-present Luo Ran
Copyright (c) 2018-present MarkText Contributors

The upstream license text is preserved unchanged in `LICENSE`.

## NAS modifications

Copyright (c) 2026 NAS FM 98.7 / Sufyan Nasser Ali

Modifications include: the right-to-left text engine in `packages/muya`
(`src/rtl`, `src/assets/styles/blockSyntax.css`, Arabic locale `src/locales/ar.ts`),
the Arabic desktop interface (`packages/desktop/static/locales/ar.json`), the
text-direction preference, the NAS application icons, the Windows installer
file-association behaviour (`packages/desktop/build/windows/installer.nsh`), the
NAS release and upstream-sync GitHub Actions workflows, and the NAS release
update feed (`packages/desktop/electron-builder.yml`).

These modifications are distributed under the same MIT License as the upstream
work. Third-party components keep their own licenses as listed in
`packages/desktop/build/THIRD-PARTY-LICENSES.txt`.
