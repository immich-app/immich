---
sidebar_position: 35
---

# Cloudron

[![Install](https://cloudron.io/img/button.svg)](https://www.cloudron.io/store/app.immich.cloudronapp.html)

Cloudron provides a one-click install option for immich with:
- [backups](https://docs.cloudron.io/backups/)
- [pre-vetted updates](https://docs.cloudron.io/updates/)
- [domain management](https://docs.cloudron.io/domains/)
- [mail server](https://docs.cloudron.io/email/)
- [centralized user management](https://docs.cloudron.io/user-management/) fully integrated into each app with LDAP or OIDC

and much more.


## Demo - Learning by doing

Open [my.demo.cloudron.io](https://my.demo.cloudron.io/) login with the username `cloudron` and password `cloudron`.

Install immich from the app store and start playing with Cloudron and immich.

## Installation

### Minimum Requirements

Cloudron requires at least:
- 2GB RAM
- 20GB Disk space
- a domain (all DNS providers work, recommended are the following [DNS Providers](https://docs.cloudron.io/domains/#dns-providers) to utilize programmatic DNS setup)

Make sure the firewall does not block port 80 (http) and 443 (https). Cloudron does not support running on ARM, LXC, Docker or OpenVZ (Open Virtuozzo).

### Install your Cloudron server

Official installation guide from [docs.cloudron.io/installation](https://docs.cloudron.io/installation/)

Run the following commands on a fresh Ubuntu Noble 24.04 (x64) server:

```bash
wget https://cloudron.io/cloudron-setup
chmod +x cloudron-setup
./cloudron-setup
```

Once installation is complete, navigate to `https://<IP>` in your browser and accept the self-signed certificate.

In Chrome, you can accept the self-signed certificate by clicking on Advanced and then click Proceed to `<ip>` (unsafe). In Firefox, click on Advanced, then Accept the Risk and Continue.

Next, select the DNS service in which the domain in hosted. If your service is not listed below, use the Wildcard or Manual option. See [DNS Providers](https://docs.cloudron.io/domains/#dns-providers) for the various providers and options.

### Install immich on your Cloudron server

On your Cloudron server, open the [App Store](https://docs.cloudron.io/apps/#installation) and install immich.

## Cloudron Support

If you have any issues with the immich app on Cloudron, please open an issue in our [Cloudron Forum](https://forum.cloudron.io/category/151/immich) first before opening an issue on the [immich GitHub Repository](https://github.com/immich-app/immich).

### immich app documentation

The documentation for the immich Cloudron app is available in our [docs.cloudron.io](https://docs.cloudron.io/packages/immich/).

### immich app source code

The source code for the immich Cloudron app is available in our [Cloudron GitLab](https://git.cloudron.io/packages/immich-app).