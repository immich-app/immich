<p align="center"> 
  <br/>  
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-green.svg?color=3F51B5&style=for-the-badge&label=License&logoColor=000000&labelColor=ececec" alt="License: MIT"></a>
  <a href="https://discord.gg/D8JsnBEuKb">
    <img src="https://img.shields.io/discord/979116623879368755.svg?label=Discord&logo=Discord&style=for-the-badge&logoColor=000000&labelColor=ececec" atl="Discord"/>
  </a>
  <br/>  
  <br/>   
</p>

<p align="center">
<img src="design/immich-logo.svg" width="150" title="Login With Custom URL">
</p>
<h3 align="center">Immich - High performance self-hosted photo and video backup solution</h3>
<br/>
<a href="https://immich.app">
<img src="design/immich-screenshots.png" title="Main Screenshot">
</a>
<br/>
<p align="center">
  <a href="README_zh_CN.md">中文</a>
</p>

## Disclaimer

- ⚠️ The project is under **very active** development.
- ⚠️ Expect bugs and breaking changes.
- ⚠️ **Do not use the app as the only way to store your photos and videos!**

## Content

- [Official Documentation](https://immich.app/docs/overview/introduction)
- [Demo](#demo)
- [Features](#features)
- [Introduction](https://immich.app/docs/overview/introduction)
- [Installation](https://immich.app/docs/installation/requirements)
- [Contribution Guidelines](https://immich.app/docs/contribution-guidelines)
- [Support The Project](#support-the-project)
- [Known Issues](#known-issues)

## Documentation

You can find the main documentation, including installation guides, at https://immich.app/.

## Demo

You can access the web demo at https://demo.immich.app

For the mobile app, you can use `https://demo.immich.app/api` for the `Server Endpoint URL`

```bash title="Demo Credential"
The credential
email: demo@immich.app
password: demo
```

```
Spec: Free-tier Oracle VM - Amsterdam - 2.4Ghz quad-core ARM64 CPU, 24GB RAM
```

# Features

| Features                                    | Mobile  | Web |
| ------------------------------------------- | ------- | --- |
| Upload and view videos and photos           | Yes     | Yes |
| Auto backup when the app is opened          | Yes     | N/A |
| Selective album(s) for backup               | Yes     | N/A |
| Download photos and videos to local device  | Yes     | Yes |
| Multi-user support                          | Yes     | Yes |
| Album and Shared albums                     | Yes     | Yes |
| Scrubbable/draggable scrollbar              | Yes     | Yes |
| Support RAW (HEIC, HEIF, DNG, Apple ProRaw) | Yes     | Yes |
| Metadata view (EXIF, map)                   | Yes     | Yes |
| Search by metadata, objects and image tags  | Yes     | No  |
| Administrative functions (user management)  | N/A     | Yes |
| Background backup                           | Android | N/A |
| Virtual scroll                              | Yes     | Yes |
| OAuth support                               | Yes     | Yes |
| LivePhoto backup and playback               | iOS     | Yes |
| User-defined storage structure              | Yes     | Yes |

# Support the project

I've committed to this project, and I will not stop. I will keep updating the docs, adding new features, and fixing bugs. But I can't do it alone. So I need your help to give me additional motivation to keep going.

As our hosts in the [selfhosted.show - In the episode 'The-organization-must-not-be-name is a Hostile Actor'](https://selfhosted.show/79?t=1418) said, this is a massive undertaking of what the team and I are doing. And I would love to someday be able to do this full-time, and I am asking for your help to make that happen.

If you feel like this is the right cause and the app is something you are seeing yourself using for a long time, please consider supporting the project with the option below.

## Donation

- [Monthly donation](https://github.com/sponsors/alextran1502) via GitHub Sponsors
- [One-time donation](https://github.com/sponsors/alextran1502?frequency=one-time&sponsor=alextran1502) via Github Sponsors

# Known Issues

## TensorFlow Build Issue

_This is a known issue for incorrect Proxmox setup_

TensorFlow doesn't run with older CPU architecture, it requires a CPU with AVX and AVX2 instruction set. If you encounter the error `illegal instruction core dump` when running the docker-compose command above, check for your CPU flags with the command and make sure you see `AVX` and `AVX2`:

```bash
more /proc/cpuinfo | grep flags
```

If you are running virtualization in Proxmox, the VM doesn't have the flag enabled.

You need to change the CPU type from `kvm64` to `host` under VMs hardware tab.

`Hardware > Processors > Edit > Advanced > Type (dropdown menu) > host`
