---
sidebar_position: 85
---

# Immich Distribution [Community]

:::note
This is a community contribution and not officially supported by the Immich team, but included here for convenience.

**Please report issues to the corresponding [Github Repository][github].**
:::

[github]: https://github.com/nsg/immich-distribution/

## About

Immich Distribution is Immich packaged in the snap package format commonly found on Ubuntu (Linux) or Ubuntu derived installations. You can read more about the snap package format, with a full list of supported distributions at the official [documentation site](https://snapcraft.io/docs).

The package is based around the idea of ease of use and automatic updates. For installation instructions see the [Snapcraft Store](https://snapcraft.io/immich-distribution) and [Immich Distribution Documentation](https://immich-distribution.nsg.cc/). The package is inspired of the official Immich images. It will be similar, but not identical with the official Docker Compose installation.

## Installation

<img
src={require('./img/immich-distribution-app-center.png').default}
width="100%"
style={{border: '1px solid #ddd'}}
alt="Installation from App Center"
/>

It should be available in App Center like any other software. But I assume you install this on a server without any graphical user interface. The CLI command to install Immich Distribution is:

```
sudo snap install immich-distribution
```

Immich should be available on port 80 shortly there after. For more information see the [installation instructions](https://immich-distribution.nsg.cc/install/).

## Issues

For issues, open an issue on the associated [GitHub Repository][github].
