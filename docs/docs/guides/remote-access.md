# Remote Access

This page gives a few pointers on how to access your Immich instance from outside your LAN.
You can read the [full discussion in Discord](https://discord.com/channels/979116623879368755/1122615710846308484)

:::danger
Never forward port 2283 directly to the internet without additional configuration. This will expose the web interface via http to the internet, making you susceptible to [man in the middle](https://en.wikipedia.org/wiki/Man-in-the-middle_attack) attacks.
:::

## Option 1: VPN to home network

You may use a VPN service to open an encrypted connection to your Immich instance. OpenVPN and Wireguard are two popular VPN solutions. Here is a guide on setting up VPN access to your server - [Pihole documentation](https://docs.pi-hole.net/guides/vpn/wireguard/overview/)

### Pros

- Simple to set up and very secure.
- Single point of potential failure, i.e., the VPN software itself. Even if there is a zero-day vulnerability on Immich, you will not be at risk.
- Both Wireguard and OpenVPN are independently security-audited, so the risk of serious zero-day exploits are minimal.

### Cons

- If you don't have a static IP address, you would need to set up a [Dynamic DNS](https://www.cloudflare.com/learning/dns/glossary/dynamic-dns/). [DuckDNS](https://www.duckdns.org/) is a free DDNS provider.
- VPN software needs to be installed and active on both server-side and client-side.
- Requires you to open a port on your router to your server.

## Option 2: Tailscale

If you are unable to open a port on your router for Wireguard or OpenVPN to your server, [Tailscale](https://tailscale.com/) is a good option. Tailscale mediates a peer-to-peer wireguard tunnel between your server and remote device, even if one or both of them are behind a [NAT firewall](https://en.wikipedia.org/wiki/Network_address_translation).

:::tip Video tutorial
You can learn how to set up Tailscale together with Immich with the [tutorial video](https://www.youtube.com/watch?v=Vt4PDUXB_fg) they created.
:::

### Pros

- Minimal configuration needed on server and client sides.
- You are protected against zero-day vulnerabilities on Immich.

### Cons

- The Tailscale client usually needs to run as root on your devices and it increases the attack surface slightly compared to a minimal Wireguard server. e.g., an [RCE vulnerability](https://github.com/tailscale/tailscale/security/advisories/GHSA-vqp6-rc3h-83cp) was discovered in the Windows Tailscale client in November 2022.
- Tailscale is a paid service. However, there is a generous [free tier](https://tailscale.com/pricing/) that permits up to 3 users and up to 100 devices.
- Tailscale needs to be installed and running on both server-side and client-side.

## Option 3: Reverse Proxy

A reverse proxy is a service that sits between web servers and clients. A reverse proxy can either be hosted on the server itself or remotely. Clients can connect to the reverse proxy via https, and the proxy relays data to Immich. This setup makes most sense if you have your own domain and want to access your Immich instance just like any other website, from outside your LAN. You can also use a DDNS provider like DuckDNS or no-ip if you don't have a domain. This configuration allows the Immich Android and iphone apps to connect to your server without a VPN or tailscale app on the client side.

If you're hosting your own reverse proxy, [Nginx](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/) is a great option. An example configuration for Nginx is provided [here](/docs/administration/reverse-proxy.md).

You'll also need your own certificate to authenticate https connections. If you're making Immich publicly accessible, [Let's Encrypt](https://letsencrypt.org/) can provide a free certificate for your domain and is the recommended option. Alternatively, a [self-signed certificate](https://en.wikipedia.org/wiki/Self-signed_certificate) allows you to encrypt your connection to Immich, but it raises a security warning on the client's browser.

A remote reverse proxy like [Cloudflare](https://www.cloudflare.com/learning/cdn/glossary/reverse-proxy/) increases security by hiding the server IP address, which makes targeted attacks like [DDoS](https://www.cloudflare.com/learning/ddos/what-is-a-ddos-attack/) harder.

### Pros

- No additional software needs to be installed client-side
- If you only need access to the web interface remotely, it is possible to set up access controls that shield you from zero-day vulnerabilities on Immich. [Cloudflare Access](https://www.cloudflare.com/zero-trust/products/access/) has a generous free tier.

### Cons

- Complex configuration
- Depending on your configuration, both the Immich web interface and API may be exposed to the internet. Immich is under very active development and the existence of severe security vulnerabilities cannot be ruled out.
