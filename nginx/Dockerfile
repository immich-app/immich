FROM docker.io/nginxinc/nginx-unprivileged:latest

COPY LICENSE /licenses/LICENSE.txt
COPY LICENSE /LICENSE

COPY nginx.conf "/etc/nginx/nginx.conf"

CMD nginx -g "daemon off;"