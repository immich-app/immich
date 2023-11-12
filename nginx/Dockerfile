FROM ghcr.io/nginxinc/nginx-unprivileged:1.25.1-alpine3.17@sha256:c38e27fdba47f725f49177b88fdd1fd2feef11b13dc11dea3695c3feb2c6d96d

COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE

COPY 10-listen-on-ipv6-by-default.sh /docker-entrypoint.d
COPY 15-set-env-variables.envsh /docker-entrypoint.d

COPY templates/ /etc/nginx/templates
