FROM ghcr.io/nginxinc/nginx-unprivileged:1.25.0-alpine3.17@sha256:5ebb90a0dd5ce841d8527abcfee4081a48de86560cd26dc64a6b1212ef59bf36

COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE

COPY 10-listen-on-ipv6-by-default.sh /docker-entrypoint.d
COPY 15-set-env-variables.envsh /docker-entrypoint.d

COPY templates/ /etc/nginx/templates
