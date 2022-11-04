<h1 align="center"> Immich </h1>
 <p align="center"> <b>High performance self-hosted photo and video backup solution.</b> </p>
<p align="center">
  <img src="design/feature-panel.png"  title="Immich Logo">
</p>

<p align="center">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-green.svg?color=3F51B5&style=for-the-badge&label=License&logoColor=000000&labelColor=ececec" alt="License: MIT"></a>
  <a href="https://github.com/alextran1502/immich"><img src="https://img.shields.io/github/stars/alextran1502/immich.svg?style=for-the-badge&logo=github&color=3F51B5&label=Stars&logoColor=000000&labelColor=ececec" alt="Star on Github"></a>
  <a href="https://immichci.little-home.net/viewType.html?buildTypeId=Immich_BuildAndroidAndGetArtifact&guest=1">
    <img src="https://img.shields.io/teamcity/http/immichci.little-home.net/s/Immich_BuildAndroidAndGetArtifact.svg?style=for-the-badge&label=Android&logo=teamcity&logoColor=000000&labelColor=ececec" alt="Android Build"/>
  </a>
  <a href="https://immichci.little-home.net/viewType.html?buildTypeId=Immich_BuildAndPublishIOSToTestFlight&guest=1">
    <img src="https://img.shields.io/teamcity/http/immichci.little-home.net/s/Immich_BuildAndPublishIOSToTestFlight.svg?style=for-the-badge&label=iOS&logo=teamcity&logoColor=000000&labelColor=ececec" alt="iOS Build"/>
  </a>
  <a href="https://actions-badge.atrox.dev/alextran1502/immich/goto?ref=main">
    <img alt="Build Status" src="https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Falextran1502%2Fimmich%2Fbadge%3Fref%3Dmain&style=for-the-badge&label=Github Action&logo=github&labelColor=ececec&logoColor=000000" />
  </a>
  <a href="https://discord.gg/D8JsnBEuKb">
    <img src="https://img.shields.io/discord/979116623879368755.svg?label=Immich%20Discord&logo=Discord&style=for-the-badge&logoColor=000000&labelColor=ececec" atl="Immich Discord"/>
  </a>
  <br/>  
  <br/>   
</p>

## Demo

You can access the web demo at https://demo.immich.app

For the mobile app, you can use https://demo.immich.app/api for the `Server Endpoint URL`


```
The credential
email: demo@immich.app
password: demo
```

```
Spec: Free-tier Oracle VM - Amsterdam - 2.4Ghz quad-core ARM64 CPU, 24GB RAM
```

## Content
- [Features](#features)
- [Screenshots](#screenshots)
- [Introduction](https://docs.immich.app/docs/overview/introduction)
- [Installation](https://docs.immich.app/docs/category/installation)
- [Contribution Guidelines](https://docs.immich.app/docs/contribution-guidelines)
- [Support The Project](#support-the-project)
- [Known Issues](#known-issues)

# Features 

> ⚠️ WARNING: **NOT READY FOR PRODUCTION! DO NOT USE TO STORE YOUR ASSETS**. This project is under heavy development. There will be continuous functions, features and api changes.

| Features | Mobile | Web |
| - | - | - | 
| Upload and view videos and photos | Yes | Yes 
| Auto backup when the app is opened | Yes | N/A
| Selective album(s) for backup | Yes | N/A
| Download photos and videos to local device | Yes | Yes
| Multi-user support | Yes | Yes
| Album | Yes | Yes
| Shared Albums | Yes | Yes
| Quick navigation with draggable scrollbar | Yes | Yes
| Support RAW (HEIC, HEIF, DNG, Apple ProRaw) | Yes | Yes
| Metadata view (EXIF, map) | Yes | Yes
| Search by metadata, objects and image tags | Yes | No
| Administrative functions (user management) | N/A | Yes
| Background backup | Android | N/A
| Virtual scroll | N/A | Yes


<br/>  

# Screenshots
<img src="design/immich-screenshots.png" title="Login With Custom URL"> 

# Support the project

I've committed to this project, and I will not stop. I will keep updating the docs, adding new features, and fixing bugs. But I can't do it alone. So I need your help to give me additional motivation to keep going.

As our hosts in the [selfhosted.show - In the episode 'The-organization-must-not-be-name is a Hostile Actor'](https://selfhosted.show/79?t=1418) said, this is a massive undertaking of what the team and I are doing. And I would love to someday be able to do this full-time, and I am asking for your help to make that happen.

If you feel like this is the right cause and the app is something you are seeing yourself using for a long time, please consider supporting the project with the option below.

## Donation

* Monthly donation via [GitHub Sponsors](https://github.com/sponsors/alextran1502)
* One-time donation via [Github Sponsors](https://github.com/sponsors/alextran1502?frequency=one-time&sponsor=alextran1502)

# Known Issues

## TensorFlow Build Issue

*This is a known issue for incorrect Proxmox setup*

TensorFlow doesn't run with older CPU architecture, it requires a CPU with AVX and AVX2 instruction set. If you encounter the error `illegal instruction core dump` when running the docker-compose command above, check for your CPU flags with the command and make sure you see `AVX` and `AVX2`:
 
```bash
more /proc/cpuinfo | grep flags
``` 
  
If you are running virtualization in Proxmox, the VM doesn't have the flag enabled.
  
You need to change the CPU type from `kvm64` to `host` under VMs hardware tab.
  
`Hardware > Processors > Edit > Advanced > Type (dropdown menu) > host`
