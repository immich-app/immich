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

## Option 4: Internet Accessible Immich with TLS Nginx Reverse Proxy

A reverse proxy is a service that sits between web servers and clients. In this option, the TLS reverse proxy will be accessible from the Internet; this means the TLS reverse proxy sits in front of the Immich web application. We will use the TLS reverse proxy to protect the Immich web application from any existing security vulnerabilities. In addition, using this option will give you a premium experience which'll allow you to use the Immich mobile app from anywhere your mobile device has an Internet connection.

:::caution
As of January 2025, the Immich mobile app does NOT fully support self-signed certificates. If you use a self-signed certificate, the mobile app will not be able to download images or view videos. [This is a known bug and there are no plans to fix it.](https://github.com/immich-app/immich/issues/15188)
:::

### Pros

- Allows the Immich mobile app to securely connect to your Immich server WITHOUT a VPN or any additional client-side software
- Upload large files, ie - avoiding [Cloudflare upload limits.](https://github.com/immich-app/immich/discussions/2357)
- Protects the Immich web app from any and all vulnerabilities

### Cons

- Complex configuration
- When using a public Internet connection, a computer's browser cannot connect directly to the Immich web app. [(You could if Immich resolved the issue.)](https://github.com/immich-app/immich/discussions/2357)

### Prerequisites

In this option I'm running Ubuntu 24 on a server at home.

This guide has the following prerequisites:
* Internal DNS server
* Dynamic DNS setup
* Nginx installed
* Certbot installed
* Immich installed
* Immich mobile app installed
* Admin access to your router/firewall

### Setup Guide

1. Setup Dynamic DNS so that your IP address is dynamically registered. In my case, my router automatically does this and generates an ugly and hard to remember static name (ie, hff007t007cv.sn.mynetname.net). Not to worry, we'll clean this up in a bit.
2. Since I am running this on my home network and have a public domain called mydomain.com, I would like to setup a subdomain called immich.mydomain.com that will always direct me to the public IP address of my home network. (Replace mydomain.com with whatever domain you have or want to use.) Using your public DNS server or service, register the subdomain immich.mydomain.com with a CNAME record of your Dynamic DNS name, ie hff007t007cv.sn.mynetname.net. Now whenever you use the public Internet, immich.mydomain.com will always resolve to your home public IP address.
3. Using your Internal DNS server or service, register the subdomain immich.mydomain.com with an A record of your Ubuntu server IP address. Effectively what we've done is establish [split DNS.](https://www.google.com/search?q=split+dns) (In my case, my router hosts the Internal DNS service as well.)
4. Use your mobile phone and connect to your local network. Lookup the address for immich.mydomain.com, it should return your internal IP address (ie, 192.168.10.20). Now switch to the public Internet by turning off WiFi and lookup the address for immich.mydomain.com, it should return your external IP address.
5. Use Certbot DNS validation to get a free SSL certificate. In this case, my DNS provider is Linode and the command to get a SSL certificate for mydomain and *.mydomain.com is `certbot certonly --dns-linode --dns-linode-credentials /etc/letsencrypt/linode.conf -d mydomain.com -d '*.mydomain.com'`. [More information about Certbot DNS validation.](https://eff-certbot.readthedocs.io/en/stable/using.html#dns-plugins)
6. Add nginx configurations. Review the [nginx configs here.](/docs/administration/reverse-proxy-tls.md) There you will see two config files - immich-tls.conf and immich-tls-header.conf. The immich-tls.conf creates a TLS reverse proxy that listens on port 443 and allows anyone on your local network who is using a browser to access Immich by visiting immich.mydomain.com. The immich-tls-header.conf creates a TLS reverse proxy that listens on port 4000 and is protected by a key; this is meant for use by the Immich mobile app only. Copy the files immich-tls.conf and immich-tls-header.conf to `/etc/nginx/conf.d/`.
7. Be sure to update the values in the immich-tls.conf and immich-tls-header.conf files. Remember the key that you specified; you'll be using it later.
8. Test your nginx changes by executing `nginx -t`. If everything is okay, go ahead and apply the changes using `systemctl reload nginx`.
9. Using your mobile phone, turn on WiFi. Launch a browser and connect to https://immich.mydomain.com. It should load successfully.
10. Again, using your mobile phone with WiFi, launch a browser and attempt to access https://immich.mydomain.com:4000/. You should receive a message `403 Forbidden`. This is expected and normal.
11. Next, using your mobile phone with WiFi, launch the Immich mobile app. If you're logged in, then logout. While logged out, click the gear icon. The settings menu should appear; click Advanced. Second from the bottom, you will see an option called "Custom Proxy Headers", click that. Next, for the Header name input `X-Access-Key`. For the Header value input the key that you entered in step 7. (If you did not change the key then the default value is `12345`.) Their is no save button, just go back to the previous view to save.
12. Now when prompted for the Immich URL input `https://immich.mydomain.com:4000/api` and login.
13. Login to your router or firewall and allow your public IP address port 4000/tcp to be forwarded to the internal IP address of immich.mydomain.com
14. Finally close the Immich mobile app on your phone and turn off WiFi; use your mobile data so that you have a public IP address. Now launch the Immich mobile app and viola! Immich mobile app everywhere!

If you 💖 my work, please consider a donation, https://ko-fi.com/ckuyehar
