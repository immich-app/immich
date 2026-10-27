# syntax=docker/dockerfile:1
# =============================================================================
# immich-go — multi-stage build (pure Go, no CGO → trivially cross-compilable)
#
# Build for the host architecture:
#   docker build -t immich-go:latest .
# Build for ODROID-C2 / any ARM64 SBC (needs buildx/QEMU or a native builder):
#   docker buildx build --platform linux/arm64 -t immich-go:latest .
# =============================================================================

# ---------- Stage 1: builder -------------------------------------------------
FROM golang:1.23-alpine AS builder

WORKDIR /src

# Cache module downloads first (only go.mod/go.sum change rarely).
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download

COPY . .

ENV CGO_ENABLED=0
ARG TARGETOS=linux
ARG TARGETARCH=arm64

# Trimmed static binaries; both server and migration CLI come from this stage.
RUN --mount=type=cache,target=/root/.cache/go-build \
    GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -trimpath -ldflags="-s -w" -o /out/immich-server ./cmd/server && \
    GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -trimpath -ldflags="-s -w" -o /out/immich-migrate ./cmd/migrate

# ---------- Stage 2: runtime --------------------------------------------------
FROM alpine:3.20

# ca-certificates: outbound TLS if you ever proxy; tzdata: EXIF local timestamps.
RUN apk add --no-cache ca-certificates tzdata

# Non-root service user; /data is the single volume you must persist.
RUN addgroup -S immich && adduser -S immich -G immich && \
    mkdir -p /data && chown -R immich:immich /data

COPY --from=builder /out/immich-server  /usr/local/bin/immich-server
COPY --from=builder /out/immich-migrate /usr/local/bin/immich-migrate

USER immich

VOLUME ["/data"]
EXPOSE 2283

ENV IMMICHGO_DATA_DIR=/data \
    IMMICHGO_DB_PATH=/data/immich.db \
    GIN_MODE=release

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:2283/api/health || exit 1

ENTRYPOINT ["/usr/local/bin/immich-server"]
