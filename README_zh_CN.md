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
<h3 align="center">Immich - 高性能的自托管照片和视频备份方案</h3>
<p align="center">  
请注意: 此README不是由Immich团队维护, 这意味着它在某一时间点不会被更新，因为我们是依靠贡献者来更新的。感谢理解。
</p>
<br/>
<a href="https://immich.app">
<img src="design/immich-screenshots.png" title="Main Screenshot">
</a>
<br/>

<p align="center">
  <a href="README.md">English</a>
</p>


## 免责声明

- ⚠️ 本项目正在 **非常活跃** 的开发中。
- ⚠️ 可能存在bug或者重大变更。
- ⚠️ **不要把本软件作为你存储照片或视频的唯一方式!**

## 目录

- [官方文档](https://immich.app/docs/overview/introduction)
- [示例](#示例)
- [功能特性](#功能特性)
- [介绍](https://immich.app/docs/overview/introduction)
- [安装](https://immich.app/docs/install/requirements)
- [贡献指南](https://immich.app/docs/overview/support-the-project)
- [支持本项目](#support-the-project)
- [已知问题](#known-issues)

## 官方文档

你可以在 https://immich.app/ 找到包含安装手册的官方文档.
## 示例

你可以在 https://demo.immich.app  访问示例.

在移动端, 你可以使用 `https://demo.immich.app/api`获取`服务终端链接`

```bash title="示例认证信息"
认证信息
邮箱: demo@immich.app
密码: demo
```

```
规格: 甲骨文免费虚拟机套餐-阿姆斯特丹 4核 2.4Ghz ARM64 CPU, 24GB RAM。
```

# 功能特性

| 功能特性                                     | 移动端  | 网页端 |
| ------------------------------------------- | ------- | --- |
| 上传并查看照片和视频                       | 是     | 是 |
| 软件运行时自动备份          | 是     | N/A |
| 选择需要备份的相册          | 是     | N/A |
| 下载照片和视频到本地  | 是     | 是 |
| 多用户支持                          | 是     | 是 |
| 相册                                       | 是     | 是 |
| 共享相册                               | 是     | 是 |
| 可拖动的快速导航栏   | 是     | 是 |
| 支持RAW格式 (HEIC, HEIF, DNG, Apple ProRaw) | 是     | 是 |
| 元数据视图 (EXIF, 地图)                   | 是     | 是 |
| 通过元数据、对象和标签进行搜索  | 是     | No  |
| 管理功能 (用户管理)  | N/A     | 是 |
| 后台备份                         | Android | N/A |
| 虚拟滚动                             | 是     | 是 |
| OAuth支持                               | 是     | 是 |
| 实时照片备份和查看 (仅iOS)   | 是     | 是 |

# 支持本项目

我已经致力于本项目并且将我会持续更新文档、新增功能和修复问题。但是我不能一个人走下去，所以我需要你给予我走下去的动力。

就像我主页里面 [selfhosted.show - In the episode 'The-organization-must-not-be-name is a Hostile Actor'](https://selfhosted.show/79?t=1418) 说的一样,这是我和团队的一项艰巨的任务。我希望某一天我能够全职开发本项目，在此我希望你们能够助我梦想成真。

如果你使用了本项目一段时间，并且觉得上面的话有道理，那么请你按照如下方式帮助我吧。

## 捐赠

- [按月捐赠](https://github.com/sponsors/alextran1502) via GitHub Sponsors
- [一次捐赠](https://github.com/sponsors/alextran1502?frequency=one-time&sponsor=alextran1502) via Github Sponsors

# 已知问题

## TensorFlow 构建问题

_这是一个针对于Proxmox的已知问题_

TensorFlow 不能运行在很旧的CPU架构上, 需要运行在AVX和AVX2指令集的CPU上。如果你在docker-compose的命令行中遇到了 `illegal instruction core dump`的错误, 通过如下命令检查你的CPU flag寄存器然后确保你能够看到`AVX`和`AVX2`的字样:

```bash
more /proc/cpuinfo | grep flags
```

如果你在Proxmox中运行虚拟机, 虚拟机中没有启用flag寄存器。

你需要在虚拟机的硬件面板中把CPU类型从`kvm64`改为`host`。

`Hardware > Processors > Edit > Advanced > Type (dropdown menu) > host`
