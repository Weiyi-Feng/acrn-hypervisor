# ACRN Configurator

This version based on tauri, WIP.

## Features

### Support Platforms

- [x] Linux (.deb, AppImage)
- [x] Windows 7,8,10 (.exe, .msi)
- [x] macOS (.app, .dmg)


## Setting Up

### 1. Install System Dependencies

Please follow [this guide](https://tauri.studio/docs/getting-started/prerequisites)
to install system dependencies (include yarn).

### 2. How To Build

#### Linux

Run this command in the acrn-hypervisor directory.

```shell
make configurator
```

#### Windows/macOS

Run follow command in the 'misc/config_tools/configurator' directory. 

```shell
yarn
yarn build
```

### 3. How To Run

#### Linux

Run this command in the acrn-hypervisor directory.

```shell
sudo apt install ./build/acrn-configurator_*.deb
acrn-configurator
```

#### Windows/macOS

You can find msi(Windows)/dmg(macOS) folder under the 
'misc/config_tools/configurator/src-tauri/target/release/bundle'
directory, the installer in the folder.

