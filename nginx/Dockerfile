FROM docker.io/nginxinc/nginx-unprivileged:latest

COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE

COPY 10-listen-on-ipv6-by-default.sh /docker-entrypoint.d
COPY 15-set-env-variables.envsh /docker-entrypoint.d

COPY templates/ /etc/nginx/templates
