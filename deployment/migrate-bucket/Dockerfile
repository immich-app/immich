FROM alpine:3.19

RUN apk add --no-cache rclone bash

COPY migrate.sh /migrate.sh
RUN chmod +x /migrate.sh

ENTRYPOINT ["/migrate.sh"]
