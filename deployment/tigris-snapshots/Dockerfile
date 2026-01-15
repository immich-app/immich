# Tigris Snapshot Machine
# Minimal image with flyctl for creating Tigris bucket snapshots

FROM debian:bookworm-slim

# Install curl for downloading flyctl
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install flyctl
RUN curl -L https://fly.io/install.sh | sh
ENV PATH="/root/.fly/bin:${PATH}"

# Copy snapshot script
WORKDIR /app
COPY snapshot.sh /app/snapshot.sh
RUN chmod +x /app/snapshot.sh

# Run snapshot script as entrypoint
ENTRYPOINT ["/app/snapshot.sh"]
