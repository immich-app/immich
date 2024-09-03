# Reverse Proxy

Users can deploy a custom reverse proxy that forwards requests to Immich. This way, the reverse proxy can handle TLS termination, load balancing, or other advanced features. All reverse proxies between Immich and the user must forward all headers and set the `Host`, `X-Real-IP`, `X-Forwarded-Proto` and `X-Forwarded-For` headers to their appropriate values. Additionally, your reverse proxy should allow for big enough uploads. By following these practices, you ensure that all custom reverse proxies are fully compatible with Immich.

:::note
The Repair page can take a long time to load. To avoid server timeouts or errors, we recommend specifying a timeout of at least 10 minutes on your proxy server.
:::

### Nginx example config

Below is an example config for nginx. Make sure to set `public_url` to the front-facing URL of your instance, and `backend_url` to the path of the Immich server.

```nginx
server {
    server_name <public_url>;

    # allow large file uploads
    client_max_body_size 50000M;

    # Set headers
    proxy_set_header Host              $http_host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # enable websockets: http://nginx.org/en/docs/http/websocket.html
    proxy_http_version 1.1;
    proxy_set_header   Upgrade    $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_redirect     off;

    # set timeout
    proxy_read_timeout 600s;
    proxy_send_timeout 600s;
    send_timeout       600s;

    location / {
        proxy_pass http://<backend_url>:2283;
    }
}
```

### Caddy example config

As an alternative to nginx, you can also use [Caddy](https://caddyserver.com/) as a reverse proxy (with automatic HTTPS configuration). Below is an example config.

```
immich.example.org {
    reverse_proxy http://<snip>:2283
}
```

### Apache example config

Below is an example config for Apache2 site configuration.

```ApacheConf
<VirtualHost *:80>
   ServerName <snip>
   ProxyRequests Off
   # set timeout in seconds
   ProxyPass / http://127.0.0.1:2283/ timeout=600 upgrade=websocket
   ProxyPassReverse / http://127.0.0.1:2283/
   ProxyPreserveHost On
</VirtualHost>
```

### HA Proxy example config

[HA Proxy](https://www.haproxy.org/) is a specialised reverse proxy and load balancer with many advanced features.

Below is an example configuration for HA Proxy 2.6

The (optional) use of Basic Auth is shown as an extra security feature.

A more advanced configuration might combine the following with a `mode tcp` SNI switch configuration, using the "Proxy Protocol" to route requests from a single listening IP address and port to a variety of different SSL end-points (local or otherwise), each with their own SSL certificate, whilst preserving the original client address data.

```
# This assumes that suitable `global` and `defaults` sections are present.
# Typically you would source these from examples distributed with HA Proxy
# or your OS.
#
# Additional security configuration for different SSL client types and usage
# scenarios can be generated using the tool at:
# https://ssl-config.mozilla.org/#server=haproxy&version=2.6&config=modern&openssl=3.0.14&guideline=5.7
#
# When you've finished customising the configration below, carry out a test of
# the resulting file e.g. `haproxy -c -f /etc/haproxy/haproxy.cfg`

# Optional basic-auth configuration:
userlist immich_extra_basicauth
	# These can (and should) be different from your normal Immich username
	# and password. You can specify one for each user, or just one per
	# installation as you prefer. If you use this, then you MUST embed the
	# basic auth username and password (only) in the server URL which you
	# give to your mobile app.  e.g.
	# https://whatever:SeCrEtPaSsWoRd@immich.example.com/
	user whatever insecure-password SeCrEtPaSsWoRd

frontend immich_ssl_term
	# High-level http(s) style frontend (not low level tcp type).
	mode http
	# The certificate file must be readable by the haproxy process, and
	# should contain BOTH the private key and certificate chain.
	# The bind directive below will listen on TCP port 443 only:
	# Adapt to your certificate file name and location:
	bind *:443,:::443 v6only ssl crt /etc/haproxy/ssl/immich.example.com.pem
	# Require basic auth for this installation - see above.  If you
	# don't want to use basic auth, then comment-out the following line:
	http-request auth unless { http_auth(immich_extra_basicauth) }
	use_backend immich_b_e

backend immich_b_e
	# TCP connection timeout for backend server
	timeout connect 5s
	# Long 10 minute timeout for the repair end-point
	timeout server 10m
	# The Immich web server requires the following http headers:
	http-request set-header X-Forwarded-Port %[dst_port]
	http-request set-header X-Forwarded-Proto https if { ssl_fc }
	http-request set-header X-Real-IP %[src]
	# Enable insertion of the X-Forwarded-For header:
	option forwardfor
	# Filter our requests with incorrect or missing host headers.
	# Adapt to your URL:
	use-server immich1 if { hdr(host) -i immich.example.com }
	# Adapt to your Immich install IP and port:
	server immich1 192.168.4.4:8080
```
