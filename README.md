<p align="center">
  <img src="design/immich-logo.svg" width="150" title="hover text">
</p>

# IMMICH

Self-hosted Photo backup solution directly from your mobile phone.

# Development

You can use docker compose for development, there are several services that compose Immich

1. The server
2. PostgreSQL
3. Redis

## Populate .env file

Navigate to `server` directory and run

```
cp .env.example .env
```

Then populate the value in there.

To start, run

```bash
docker-compose -f ./server/docker-compose.yml up
```

To force rebuild node modules after installing new packages

```bash
docker-compose -f ./server/docker-compose.yml up --build -V
```

# Known Issue

TensorFlow doesn't run with older CPU architecture, it requires CPU with AVX and AVX2 instruction set. If you encounter error `illegal instruction core dump` when running the docker-compose command above, check for your CPU flags with the command ad make sure you see `AVX` and `AVX2`. Otherwise, switch to a different VM/desktop with different architecture.

```bash
more /proc/cpuinfo | grep flags
```

If you are running virtualization in Promox, the VM doesn't have the flag enable.

You need to change the CPU type from `kvm64` to `host` under VMs hardware tab.

`Hardware > Processors > Edit > Advanced > Type (dropdown menu) > host`
