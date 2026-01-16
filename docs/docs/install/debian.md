---
sidebar_position: 86
---

# Debian / Ubuntu [Community]

:::note
This is a community contribution and not officially supported by the Immich team, but included here for convenience.

**Please report package issues to the corresponding [Github Repository](https://github.com/dionysius/immich-deb).**
:::

Immich can be installed natively on Debian and Ubuntu systems using community-maintained Debian packages. This installation method runs Immich directly on your system without Docker, providing an alternative deployment option for those who prefer native package management.

The [immich-deb project](https://github.com/dionysius/immich-deb) provides easy-to-install and highly configurable Debian packages that support both simple all-in-one installations and advanced setups where server components can be installed separately. The packages include support for hardware acceleration to improve performance for transcoding and machine learning tasks.

## Installation Options

There are three ways to install Immich using Debian packages:

- An APT repository is available at [apt.crunchy.run/immich](https://apt.crunchy.run/immich) for easy installation and updates
- Pre-built packages are available in the [releases section](https://github.com/dionysius/immich-deb/releases) and can be installed manually
- The project provides a Debian source package that can be [compiled on your system](https://github.com/dionysius/immich-deb#build-source-package)

## Resources

For detailed information, refer to the [immich-deb wiki](https://github.com/dionysius/immich-deb/wiki):

- [Installation Guide](https://github.com/dionysius/immich-deb/wiki/Installation) - Detailed installation instructions and prerequisites
- [Configuration](https://github.com/dionysius/immich-deb/wiki/Configuration) - Setup and configuration options
- [Hardware Acceleration](https://github.com/dionysius/immich-deb/wiki/Hardware-Acceleration) - Setup GPU acceleration for transcoding and machine learning
- [External Libraries](https://github.com/dionysius/immich-deb/wiki/External-Libraries) - Configure access to media outside the default directory

:::tip
For more information on how to use the application, please refer to the [Post Installation](/install/post-install.mdx) guide.
:::
