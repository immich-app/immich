---
sidebar_position: 40
---

# Kubernetes

You can deploy Immich on Kubernetes using [the official Helm chart](https://github.com/immich-app/immich-charts/tree/main/charts/immich).

If you want examples of how other people run Immich on Kubernetes, using the official chart or otherwise, you can find them at https://nanne.dev/k8s-at-home-search/#/immich.

:::caution DNS in Alpine containers
Immich makes use of Alpine container images. These can encounter [a DNS resolution bug](https://stackoverflow.com/a/65593511) on Kubernetes clusters if the host
nodes have a search domain set, like:

```
$ cat /etc/resolv.conf
search home.lan
nameserver 192.168.1.1
```

:::
