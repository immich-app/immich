FROM ghcr.io/nginxinc/nginx-unprivileged:1.25.0-alpine3.17@sha256:e57300e9f60e521c5af3ec8fdc710285a371647e8033bcb8a36020c4394db3e3

COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE

COPY 10-listen-on-ipv6-by-default.sh /docker-entrypoint.d
COPY 15-set-env-variables.envsh /docker-entrypoint.d

COPY templates/ /etc/nginx/templates
