# ACRN Configurator

This version based on tauri, WIP.

## Features

### Support Platforms
- [x] Windows 7,8,10 (.exe, .msi)
- [x] Linux (.deb, AppImage)
- [x] macOS (.app, .dmg)

## Setting Up

### 1. Install System Dependencies

Please follow [this guide](https://tauri.studio/docs/getting-started/prerequisites)
to install system dependencies (include yarn).  

### 2. Run ACRN Configurator

Clone project and install project nodejs dependency.

```shell
git clone https://github.com/intel-sandbox/acrn-new-ui
cd acrn-configurator
yarn
```

### run application at dev mode

```shell
yarn dev
```

### build application and run it in prod mode

Use command `yarn build` to build current platform acrn-configurator installer,
after this command finishes running, you will see it under `src-tauri/target/release/bundle`

Debian

```shell
yarn build
sudo apt install ./src-tauri/target/release/bundle/deb/acrn-configurator_*.deb
acrn-configurator
```
